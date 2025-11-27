const path = require('path');

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  schedulerIntervalMs: parseInt(process.env.SCHEDULER_INTERVAL_MS || '60000', 10),
  dataFile: process.env.DATA_FILE || path.join(process.cwd(), 'data', 'db.json'),
  disableScheduler: process.env.DISABLE_SCHEDULER === 'true'
};

module.exports = config;
