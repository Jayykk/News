import { MarketDataPoint } from '../services/MarketDataService.js';

export class MarketDataRepository {
  private history: MarketDataPoint[] = [];

  save(dataPoint: MarketDataPoint): void {
    this.history.push(dataPoint);
  }

  latest(): MarketDataPoint | undefined {
    if (this.history.length === 0) {
      return undefined;
    }
    return this.history[this.history.length - 1];
  }
}
