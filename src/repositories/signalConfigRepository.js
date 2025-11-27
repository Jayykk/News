const { readDb, writeDb } = require('../db/datastore');
const { randomUUID } = require('crypto');

async function getActiveConfig() {
  const db = await readDb();
  const active = db.signal_configs.find((c) => c.is_active);
  if (active) {
    return active;
  }
  const defaultConfig = {
    id: randomUUID(),
    name: 'default',
    weights: { w_ret_1h: 0.25, w_volume: 0.25, w_volatility: 0.25, w_news: 0.25 },
    thresholds: { impact_alert: 0.6, severe_alert: 0.8 },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  db.signal_configs.push(defaultConfig);
  await writeDb(db);
  return defaultConfig;
}

module.exports = {
  getActiveConfig
};
