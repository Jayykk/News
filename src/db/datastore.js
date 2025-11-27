const fs = require('fs/promises');
const path = require('path');
const config = require('../config');

const defaultDb = {
  raw_news: [],
  news_analysis: [],
  market_snapshots: [],
  signals: [],
  alerts: [],
  signal_configs: [],
  proposed_orders: []
};

async function ensureDataFile() {
  const dir = path.dirname(config.dataFile);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(config.dataFile);
  } catch (err) {
    await fs.writeFile(config.dataFile, JSON.stringify(defaultDb, null, 2));
  }
}

async function readDb() {
  await ensureDataFile();
  const raw = await fs.readFile(config.dataFile, 'utf-8');
  return JSON.parse(raw);
}

async function writeDb(db) {
  await fs.writeFile(config.dataFile, JSON.stringify(db, null, 2));
}

module.exports = {
  defaultDb,
  ensureDataFile,
  readDb,
  writeDb
};
