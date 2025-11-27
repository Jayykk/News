const alertRepository = require('../repositories/alertRepository');

async function createAlert(rawNews, analysis, signal) {
  const summary = `${rawNews.source || 'unknown'}: ${rawNews.title || 'Untitled'}`;
  const disclaimer = 'For information only. Not investment advice.';
  return alertRepository.create({
    raw_news_id: rawNews.id,
    analysis_id: analysis.id,
    impact_score: signal.impact_score,
    score_components: signal.score_components,
    severity: signal.severity,
    summary: `${summary}\n${disclaimer}`,
    dispatched_channels: [],
    dispatched_at: null
  });
}

module.exports = {
  createAlert
};
