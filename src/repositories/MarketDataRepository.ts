import { MarketDataPoint } from '../services/MarketDataService.js';

export class MarketDataRepository {
  private history: MarketDataPoint[] = [];

  save(dataPoint: MarketDataPoint): void {
    this.history.push(dataPoint);
  }

  latest(): MarketDataPoint | undefined {
    return this.history.at(-1);
  }
}
