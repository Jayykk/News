const { readDb, writeDb } = require('../db/datastore');
const { randomUUID } = require('crypto');

async function create(alert) {
  const db = await readDb();
  const record = {
    id: randomUUID(),
    status: 'pending',
    dispatched_channels: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...alert
  };
  db.alerts.push(record);
  await writeDb(db);
  return record;
}

async function list({ severity, limit = 50 } = {}) {
  const db = await readDb();
  let items = [...db.alerts];
  if (severity) {
    items = items.filter((a) => a.severity === severity);
  }
  items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return items.slice(0, limit);
}

async function findById(id) {
  const db = await readDb();
  return db.alerts.find((a) => a.id === id) || null;
}

module.exports = {
  create,
  list,
  findById
};
