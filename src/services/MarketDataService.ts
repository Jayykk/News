export type MarketDataPoint = {
  symbol: string;
  price: number;
  timestamp: Date;
};

export class MarketDataService {
  fetchLatest(symbol: string): MarketDataPoint {
    // Placeholder: in real implementation, call external API
    return {
      symbol,
      price: 0,
      timestamp: new Date(),
    };
  }
}
