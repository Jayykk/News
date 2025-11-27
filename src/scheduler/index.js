const config = require('../config');
const rawNewsRepository = require('../repositories/rawNewsRepository');
const newsAnalysisRepository = require('../repositories/newsAnalysisRepository');
const alertRepository = require('../repositories/alertRepository');
const analysisService = require('../services/newsAnalysisService');
const marketDataService = require('../services/marketDataService');
const signalService = require('../services/signalService');
const alertService = require('../services/alertService');

async function collectStubNews() {
  const now = new Date();
  const symbols = ['AAPL', 'TSLA', 'GOOG'];
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const title = `Auto news for ${symbol} at ${now.toISOString()}`;
  return rawNewsRepository.create({
    source: 'scheduler',
    title,
    content: `${symbol} reports strong growth in latest quarter`,
    url: 'https://example.com/news',
    published_at: now.toISOString(),
    collected_at: now.toISOString(),
    language: 'en',
    symbols_raw: [symbol],
    hash: `${symbol}-${now.getTime()}`
  });
}

async function processAnalysis(rawNews) {
  const analysis = await analysisService.analyze(rawNews);
  const saved = await newsAnalysisRepository.upsert(rawNews.id, analysis);
  const snapshots = await marketDataService.fetchSnapshot(rawNews.symbols_raw || []);
  const snapshot = snapshots[0] || null;
  const { signal } = await signalService.score(rawNews, saved, snapshot);
  const alert = await alertService.createAlert(rawNews, saved, signal);
  return { analysis: saved, signal, alert };
}

async function runOnce() {
  const existingNews = await rawNewsRepository.listAll();
  for (const news of existingNews) {
    const existingAlert = (await alertRepository.list({ limit: 1000 })).find((a) => a.raw_news_id === news.id);
    if (existingAlert) {
      continue;
    }
    await processAnalysis(news);
  }
}

function startSchedulers() {
  if (config.disableScheduler) {
    return [];
  }
  const collectInterval = setInterval(() => {
    collectStubNews()
      .then((news) => processAnalysis(news))
      .catch((err) => {
        console.error('Scheduler interval error', err);
      });
  }, config.schedulerIntervalMs);

  // Kick off initial run
  collectStubNews().then((news) => processAnalysis(news)).catch(() => {});
  runOnce().catch(() => {});

  return [collectInterval];
}

module.exports = {
  startSchedulers,
  processAnalysis,
  collectStubNews,
  runOnce
};
