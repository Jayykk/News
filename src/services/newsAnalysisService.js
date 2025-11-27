const keywords = {
  positive: ['gain', 'growth', 'surge', 'record'],
  negative: ['loss', 'decline', 'drop', 'fraud']
};

function classifySentiment(content) {
  const text = (content || '').toLowerCase();
  const positiveHits = keywords.positive.some((k) => text.includes(k));
  const negativeHits = keywords.negative.some((k) => text.includes(k));
  if (positiveHits && !negativeHits) return 'positive';
  if (negativeHits && !positiveHits) return 'negative';
  if (positiveHits && negativeHits) return 'mixed';
  return 'neutral';
}

async function analyze(rawNews) {
  const sentiment = classifySentiment(`${rawNews.title || ''} ${rawNews.content || ''}`);
  return {
    assets: { symbols: rawNews.symbols_raw || [] },
    event_type: 'headline',
    sentiment,
    is_rumor: false,
    is_confirmed_by_official: true,
    time_relevance: 'recent',
    price_direction_hint: sentiment === 'positive' ? 'up' : sentiment === 'negative' ? 'down' : 'flat',
    key_reasons: sentiment === 'neutral' ? [] : [`Detected ${sentiment} keyword`],
    raw_confidence: sentiment === 'neutral' ? 0.4 : 0.7,
    extra: { stub: true }
  };
}

module.exports = {
  analyze,
  classifySentiment
};
