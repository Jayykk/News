import express from 'express';
import { getConfig } from './config/index.js';
import { healthRouter } from './routes/health.js';
import { newsRouter } from './routes/news.js';
import { alertsRouter } from './routes/alerts.js';

const config = getConfig();
const app = express();

app.use(express.json());

app.use('/health', healthRouter);
app.use('/news', newsRouter);
app.use('/alerts', alertsRouter);

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running in ${config.environment} mode on port ${config.port}`);
});
