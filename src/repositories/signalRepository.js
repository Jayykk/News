const { readDb, writeDb } = require('../db/datastore');
const { randomUUID } = require('crypto');

async function create(signal) {
  const db = await readDb();
  const record = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...signal
  };
  db.signals.push(record);
  await writeDb(db);
  return record;
}

async function listByRawNewsId(rawNewsId) {
  const db = await readDb();
  return db.signals.filter((s) => s.raw_news_id === rawNewsId);
}

module.exports = {
  create,
  listByRawNewsId
};
