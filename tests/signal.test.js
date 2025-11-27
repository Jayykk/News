const assert = require('assert');
const { calculateImpactScore } = require('../src/services/signalService');

function testImpactScore() {
  const analysis = { raw_confidence: 0.8 };
  const marketSnapshot = { ret_1h: 0.1, volume_ratio_1h: 1.5, volatility_ratio_1h: 1.2 };
  const config = { weights: { w_ret_1h: 0.25, w_volume: 0.25, w_volatility: 0.25, w_news: 0.25 } };
  const score = calculateImpactScore(analysis, marketSnapshot, config);
  assert(score > 0.5, 'Impact score should reflect positive inputs');
}

testImpactScore();
