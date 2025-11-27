async function fetchSnapshot(symbols = []) {
  const now = new Date().toISOString();
  return symbols.map((symbol, index) => ({
    id: `${symbol}-${now}`,
    symbol,
    asset_type: 'equity',
    price_now: 100 + index,
    ret_5m: 0.01 * index,
    ret_1h: 0.02 * index,
    volume_ratio_1h: 1 + index * 0.1,
    volatility_ratio_1h: 1 + index * 0.05,
    collected_at: now
  }));
}

module.exports = {
  fetchSnapshot
};
