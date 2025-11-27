const { readDb, writeDb } = require('../db/datastore');
const { randomUUID } = require('crypto');

async function create(rawNews) {
  const db = await readDb();
  const record = {
    id: randomUUID(),
    ingest_status: 'ingested',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...rawNews
  };
  db.raw_news.push(record);
  await writeDb(db);
  return record;
}

async function list({ symbol, limit = 50 } = {}) {
  const db = await readDb();
  let items = [...db.raw_news];
  if (symbol) {
    items = items.filter((n) => Array.isArray(n.symbols_raw) && n.symbols_raw.includes(symbol));
  }
  items.sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));
  return items.slice(0, limit);
}

async function findById(id) {
  const db = await readDb();
  return db.raw_news.find((n) => n.id === id) || null;
}

async function listAll() {
  const db = await readDb();
  return db.raw_news;
}

module.exports = {
  create,
  list,
  findById,
  listAll
};
