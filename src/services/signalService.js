const signalRepository = require('../repositories/signalRepository');
const signalConfigRepository = require('../repositories/signalConfigRepository');

function calculateImpactScore(analysis, marketSnapshot, config) {
  const weights = config.weights || { w_ret_1h: 0.25, w_volume: 0.25, w_volatility: 0.25, w_news: 0.25 };
  const newsScore = analysis.raw_confidence || 0.5;
  const retScore = Math.min(Math.max((marketSnapshot?.ret_1h || 0) + 0.5, 0), 1);
  const volumeScore = Math.min(Math.max((marketSnapshot?.volume_ratio_1h || 1) / 2, 0), 1);
  const volatilityScore = Math.min(Math.max((marketSnapshot?.volatility_ratio_1h || 1) / 2, 0), 1);
  const score =
    weights.w_ret_1h * retScore +
    weights.w_volume * volumeScore +
    weights.w_volatility * volatilityScore +
    weights.w_news * newsScore;
  return Number(score.toFixed(3));
}

async function score(rawNews, analysis, marketSnapshot) {
  const config = await signalConfigRepository.getActiveConfig();
  const impact_score = calculateImpactScore(analysis, marketSnapshot, config);
  const severity = impact_score >= config.thresholds.severe_alert
    ? 'critical'
    : impact_score >= config.thresholds.impact_alert
      ? 'high'
      : 'info';
  const signal = await signalRepository.create({
    raw_news_id: rawNews.id,
    impact_score,
    severity,
    score_components: { analysis, marketSnapshot }
  });
  return { signal, config };
}

module.exports = {
  calculateImpactScore,
  score
};
