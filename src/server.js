const http = require('http');
const { URL } = require('url');
const config = require('./config');
const rawNewsRepository = require('./repositories/rawNewsRepository');
const newsAnalysisRepository = require('./repositories/newsAnalysisRepository');
const alertRepository = require('./repositories/alertRepository');
const scheduler = require('./scheduler');
const analysisService = require('./services/newsAnalysisService');
const marketDataService = require('./services/marketDataService');
const signalService = require('./services/signalService');
const alertService = require('./services/alertService');
const { ensureDataFile } = require('./db/datastore');

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (!chunks.length) return null;
  try {
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch (err) {
    return null;
  }
}

async function handleNewsList(req, res, url) {
  const symbol = url.searchParams.get('symbol') || undefined;
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 50;
  const news = await rawNewsRepository.list({ symbol, limit });
  const withAnalysis = await Promise.all(
    news.map(async (item) => ({
      ...item,
      analysis: await newsAnalysisRepository.findByRawNewsId(item.id)
    }))
  );
  sendJson(res, 200, withAnalysis);
}

async function handleNewsDetail(req, res, id) {
  const news = await rawNewsRepository.findById(id);
  if (!news) {
    return sendJson(res, 404, { message: 'Not found' });
  }
  const analysis = await newsAnalysisRepository.findByRawNewsId(id);
  return sendJson(res, 200, { raw: news, analysis });
}

async function handleAlerts(req, res, url) {
  const severity = url.searchParams.get('severity') || undefined;
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 50;
  const alerts = await alertRepository.list({ severity, limit });
  sendJson(res, 200, alerts);
}

async function handleAlertDetail(req, res, id) {
  const alert = await alertRepository.findById(id);
  if (!alert) {
    return sendJson(res, 404, { message: 'Not found' });
  }
  const news = await rawNewsRepository.findById(alert.raw_news_id);
  const analysis = await newsAnalysisRepository.findByRawNewsId(alert.raw_news_id);
  return sendJson(res, 200, { alert, raw: news, analysis });
}

async function handleReanalyze(req, res, id) {
  const news = await rawNewsRepository.findById(id);
  if (!news) {
    return sendJson(res, 404, { message: 'Not found' });
  }
  const analysis = await analysisService.analyze(news);
  const saved = await newsAnalysisRepository.upsert(news.id, analysis);
  const snapshots = await marketDataService.fetchSnapshot(news.symbols_raw || []);
  const snapshot = snapshots[0] || null;
  const { signal } = await signalService.score(news, saved, snapshot);
  const alert = await alertService.createAlert(news, saved, signal);
  return sendJson(res, 200, { status: 're-analyzed', alertId: alert.id });
}

async function requestListener(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const segments = url.pathname.split('/').filter(Boolean);

  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
  }

  if (req.method === 'GET' && url.pathname === '/news') {
    return handleNewsList(req, res, url);
  }

  if (req.method === 'GET' && segments[0] === 'news' && segments[1]) {
    return handleNewsDetail(req, res, segments[1]);
  }

  if (req.method === 'GET' && url.pathname === '/alerts') {
    return handleAlerts(req, res, url);
  }

  if (req.method === 'GET' && segments[0] === 'alerts' && segments[1]) {
    return handleAlertDetail(req, res, segments[1]);
  }

  if (req.method === 'POST' && segments[0] === 'admin' && segments[1] === 're-analyze-news' && segments[2]) {
    await parseBody(req); // consume body if provided
    return handleReanalyze(req, res, segments[2]);
  }

  sendJson(res, 404, { message: 'Not found' });
}

async function bootstrap() {
  await ensureDataFile();
  const intervals = scheduler.startSchedulers();
  const server = http.createServer((req, res) => {
    requestListener(req, res);
  });
  server.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });
  return { server, intervals };
}

if (require.main === module) {
  bootstrap();
}

module.exports = { bootstrap };
