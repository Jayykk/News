export type MarketSnapshot = {
  symbol: string;
  price_now: number;
  ret_5m: number;
  ret_1h: number;
  volume_ratio_1h: number;
  volatility_ratio_1h: number;
};

export class MarketDataService {
  fetchSnapshot(symbols: string[]): MarketSnapshot[] {
    if (!symbols.length) {
      return [];
    }
    return symbols.map((symbol) => this.buildStubSnapshot(symbol));
  }

  private buildStubSnapshot(symbol: string): MarketSnapshot {
    const randomWithin = (min: number, max: number) => Math.random() * (max - min) + min;
    return {
      symbol,
      price_now: Number(randomWithin(10, 500).toFixed(2)),
      ret_5m: Number(randomWithin(-0.03, 0.03).toFixed(4)),
      ret_1h: Number(randomWithin(-0.05, 0.05).toFixed(4)),
      volume_ratio_1h: Number(randomWithin(0.5, 2.5).toFixed(2)),
      volatility_ratio_1h: Number(randomWithin(0.5, 2.5).toFixed(2)),
    };
  }
}
