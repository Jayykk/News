import dotenv from 'dotenv';

dotenv.config();

export type AppConfig = {
  port: number;
  environment: string;
};

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getConfig = (): AppConfig => ({
  port: parseNumber(process.env.PORT, 3000),
  environment: process.env.NODE_ENV ?? 'development',
});
