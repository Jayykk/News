import cron, { ScheduledTask } from 'node-cron';
import { getConfig } from '../config/index.js';
import { RawNewsRepository } from '../repositories/RawNewsRepository.js';
import { NewsAnalysisService } from '../services/NewsAnalysisService.js';
import { SignalService } from '../services/SignalService.js';
import { RealNewsCollector } from '../collectors/RealNewsCollector.js';
import { INewsCollector } from '../collectors/INewsCollector.js';

const STUB_SYMBOLS = ['AAPL', 'TSLA', 'GOOG', 'MSFT'];

export type SchedulerControl = {
  stop: () => void;
  task: ScheduledTask;
};

const rawNewsRepository = new RawNewsRepository();
const newsAnalysisService = new NewsAnalysisService();
const signalService = new SignalService();

function buildCollector(config = getConfig()): INewsCollector | null {
  if (config.newsSourceMode === 'real') {
    return new RealNewsCollector();
  }
  return null;
}

async function collectStubNews(batchSize: number) {
  const tasks: Promise<unknown>[] = [];
  for (let i = 0; i < batchSize; i += 1) {
    const symbol = STUB_SYMBOLS[Math.floor(Math.random() * STUB_SYMBOLS.length)];
    const now = new Date();
    tasks.push(
      rawNewsRepository.create({
        source: 'scheduler',
        title: `Auto news for ${symbol} at ${now.toISOString()}`,
        content: `${symbol} reports strong growth in latest quarter`,
        url: 'https://example.com/news',
        publishedAt: now,
        language: 'en',
        symbolsRaw: [symbol],
      })
    );
  }
  return Promise.all(tasks);
}

async function collectRealNews(collector: INewsCollector) {
  const latest = await rawNewsRepository.findLatestCollected();
  const since = latest?.collectedAt ?? latest?.createdAt ?? null;
  const items = await collector.fetchLatestNews(since);
  for (const item of items) {
    // eslint-disable-next-line no-await-in-loop
    await rawNewsRepository.insertIfNotExists(item);
  }
  return items.length;
}

async function processRawNews(rawNewsId: string) {
  const raw = await rawNewsRepository.findById(rawNewsId);
  if (!raw) return null;
  const analysis = await newsAnalysisService.analyze(raw);
  const { signal } = await signalService.score(raw, analysis);
  return { analysis, signal };
}

async function processPending() {
  const pending = await rawNewsRepository.listUnanalysed(50);
  for (const raw of pending) {
    // eslint-disable-next-line no-await-in-loop
    await processRawNews(raw.id);
  }
}

async function runCycle(batchSize: number, collector: INewsCollector | null) {
  const config = getConfig();
  if (config.newsSourceMode === 'real' && collector) {
    await collectRealNews(collector);
  } else {
    const created = await collectStubNews(batchSize);
    for (const raw of created) {
      // eslint-disable-next-line no-await-in-loop
      await processRawNews((raw as any).id);
    }
  }
  await processPending();
}

export function startScheduler(): SchedulerControl | null {
  const config = getConfig();
  const collector = buildCollector(config);
  if (config.disableScheduler) {
    // eslint-disable-next-line no-console
    console.log('Scheduler disabled via DISABLE_SCHEDULER');
    return null;
  }

  // eslint-disable-next-line no-console
  console.log(`Starting scheduler with cron: ${config.schedulerCron}`);

  const task = cron.schedule(config.schedulerCron, async () => {
    try {
      await runCycle(config.schedulerStubBatch, collector);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Scheduler cycle failed', error);
    }
  });

  void runCycle(config.schedulerStubBatch, collector).catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Initial scheduler cycle failed', error);
  });

  return {
    stop: () => task.stop(),
    task,
  };
}
