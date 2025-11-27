const assert = require('assert');
const { classifySentiment } = require('../src/services/newsAnalysisService');

function testPositiveSentiment() {
  const sentiment = classifySentiment('Company reports record gain in revenue');
  assert.strictEqual(sentiment, 'positive');
}

function testNegativeSentiment() {
  const sentiment = classifySentiment('Facing allegations of fraud and major loss');
  assert.strictEqual(sentiment, 'negative');
}

testPositiveSentiment();
testNegativeSentiment();
