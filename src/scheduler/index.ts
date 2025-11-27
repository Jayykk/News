import cron, { ScheduledTask } from 'node-cron';
import { getConfig } from '../config/index.js';
import * as rawNewsRepository from '../repositories/rawNewsRepository.js';
import * as newsAnalysisRepository from '../repositories/newsAnalysisRepository.js';
import * as alertRepository from '../repositories/alertRepository.js';
import * as analysisService from '../services/newsAnalysisService.js';
import * as marketDataService from '../services/marketDataService.js';
import * as signalService from '../services/signalService.js';
import * as alertService from '../services/alertService.js';

const STUB_SYMBOLS = ['AAPL', 'TSLA', 'GOOG', 'MSFT'];

export type SchedulerControl = {
  stop: () => void;
  task: ScheduledTask;
};

async function collectStubNews(batchSize: number) {
  const now = new Date();
  const created: unknown[] = [];
  for (let i = 0; i < batchSize; i += 1) {
    const symbol = STUB_SYMBOLS[Math.floor(Math.random() * STUB_SYMBOLS.length)];
    const timestamp = new Date(now.getTime() + i * 1000);
    // The JSON-backed repository performs a read-modify-write, so writes must be serialized
    // to avoid clobbering concurrent updates when batch size > 1.
    // eslint-disable-next-line no-await-in-loop
    created.push(
      await rawNewsRepository.create({
        source: 'scheduler',
        title: `Auto news for ${symbol} at ${timestamp.toISOString()}`,
        content: `${symbol} reports strong growth in latest quarter`,
        url: 'https://example.com/news',
        published_at: timestamp.toISOString(),
        collected_at: timestamp.toISOString(),
        language: 'en',
        symbols_raw: [symbol],
        hash: `${symbol}-${timestamp.getTime()}`
      })
    );
  }
  return created;
}

async function processSingle(rawNews: any) {
  const existingAnalysis = await newsAnalysisRepository.findByRawNewsId(rawNews.id);
  const analysis = existingAnalysis ?? (await newsAnalysisRepository.upsert(rawNews.id, await analysisService.analyze(rawNews)));
  const snapshots = await marketDataService.fetchSnapshot(rawNews.symbols_raw || []);
  const snapshot = snapshots[0] || null;
  const { signal } = await signalService.score(rawNews, analysis, snapshot);
  const alert = await alertService.createAlert(rawNews, analysis, signal);
  return { analysis, signal, alert };
}

async function processPending() {
  const rawItems = await rawNewsRepository.listAll();
  const existingAlerts = await alertRepository.list({ limit: 1000 });
  for (const raw of rawItems) {
    const alreadyAlerted = existingAlerts.some((a: any) => a.raw_news_id === raw.id);
    if (alreadyAlerted) continue;
    // eslint-disable-next-line no-await-in-loop
    await processSingle(raw);
  }
}

async function runCycle(batchSize: number) {
  const created = await collectStubNews(batchSize);
  for (const raw of created) {
    // eslint-disable-next-line no-await-in-loop
    await processSingle(raw);
  }
  await processPending();
}

export function startScheduler(): SchedulerControl | null {
  const config = getConfig();
  if (config.disableScheduler) {
    // eslint-disable-next-line no-console
    console.log('Scheduler disabled via DISABLE_SCHEDULER');
    return null;
  }

  // eslint-disable-next-line no-console
  console.log(`Starting scheduler with cron: ${config.schedulerCron}`);

  const task = cron.schedule(config.schedulerCron, async () => {
    try {
      await runCycle(config.schedulerStubBatch);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Scheduler cycle failed', error);
    }
  });

  // Kick off one immediate run
  void runCycle(config.schedulerStubBatch).catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Initial scheduler cycle failed', error);
  });

  return {
    stop: () => task.stop(),
    task
  };
}
