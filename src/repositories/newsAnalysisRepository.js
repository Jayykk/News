const { readDb, writeDb } = require('../db/datastore');
const { randomUUID } = require('crypto');

async function upsert(rawNewsId, analysis) {
  const db = await readDb();
  const existingIndex = db.news_analysis.findIndex((a) => a.raw_news_id === rawNewsId);
  const record = {
    id: existingIndex >= 0 ? db.news_analysis[existingIndex].id : randomUUID(),
    raw_news_id: rawNewsId,
    created_at: existingIndex >= 0 ? db.news_analysis[existingIndex].created_at : new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...analysis
  };
  if (existingIndex >= 0) {
    db.news_analysis[existingIndex] = record;
  } else {
    db.news_analysis.push(record);
  }
  await writeDb(db);
  return record;
}

async function findByRawNewsId(rawNewsId) {
  const db = await readDb();
  return db.news_analysis.find((a) => a.raw_news_id === rawNewsId) || null;
}

module.exports = {
  upsert,
  findByRawNewsId
};
