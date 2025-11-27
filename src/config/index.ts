import dotenv from 'dotenv';

dotenv.config();

export type AppConfig = {
  port: number;
  environment: string;
  schedulerCron: string;
  schedulerStubBatch: number;
  disableScheduler: boolean;
};

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getConfig = (): AppConfig => ({
  port: parseNumber(process.env.PORT, 3000),
  environment: process.env.NODE_ENV ?? 'development',
  schedulerCron: process.env.SCHEDULER_CRON ?? '*/5 * * * *',
  schedulerStubBatch: parseNumber(process.env.SCHEDULER_STUB_BATCH, 2),
  disableScheduler: process.env.DISABLE_SCHEDULER === 'true',
});
