import { MarketDataPoint } from '../services/MarketDataService.js';

export class MarketDataRepository {
  private history: MarketDataPoint[] = [];

  save(dataPoint: MarketDataPoint): void {
    this.history.push(dataPoint);
  }

  latest(): MarketDataPoint | undefined {
    return this.history.length ? this.history[this.history.length - 1] : undefined;
  }
}
