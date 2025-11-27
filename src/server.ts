import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getConfig } from './config/index.js';
import { healthRouter } from './routes/health.js';
import { newsRouter } from './routes/news.js';
import { alertsRouter } from './routes/alerts.js';
import { statsRouter } from './routes/stats.js';
import { symbolsRouter } from './routes/symbols.js';
import { startScheduler } from './scheduler/index.js';

const config = getConfig();
const app = express();

app.use(express.json());

app.use('/health', healthRouter);
app.use('/news', newsRouter);
app.use('/alerts', alertsRouter);
app.use('/stats', statsRouter);
app.use('/symbols', symbolsRouter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDistPath = path.resolve(__dirname, '../web/dist');
if (fs.existsSync(webDistPath)) {
  app.use('/app', express.static(webDistPath));
  app.get(['/app', '/app/*'], (_req, res) => {
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running in ${config.environment} mode on port ${config.port}`);
});

const schedulerControl = startScheduler();

process.on('SIGINT', () => {
  schedulerControl?.stop();
});
