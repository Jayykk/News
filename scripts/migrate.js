const fs = require('fs/promises');
const path = require('path');
const { defaultDb } = require('../src/db/datastore');
const config = require('../src/config');

async function run() {
  const dir = path.dirname(config.dataFile);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(config.dataFile, JSON.stringify(defaultDb, null, 2));
  const migrationsDir = path.join(process.cwd(), 'migrations');
  await fs.mkdir(migrationsDir, { recursive: true });
  const sqlPath = path.join(migrationsDir, '001_init.sql');
  const sqlContent = `-- Schema stub for PostgreSQL\n` +
    `CREATE TABLE IF NOT EXISTS raw_news (...);\n` +
    `CREATE TABLE IF NOT EXISTS news_analysis (...);\n` +
    `CREATE TABLE IF NOT EXISTS market_snapshots (...);\n` +
    `CREATE TABLE IF NOT EXISTS signals (...);\n` +
    `CREATE TABLE IF NOT EXISTS alerts (...);\n` +
    `CREATE TABLE IF NOT EXISTS signal_configs (...);\n` +
    `CREATE TABLE IF NOT EXISTS proposed_orders (...);\n`;
  await fs.writeFile(sqlPath, sqlContent);
  console.log('Migration completed. Data file and SQL stub ready.');
}

run();
