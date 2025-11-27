import { MarketDataPoint } from './MarketDataService.js';

export class SignalService {
  generateSignal(dataPoint: MarketDataPoint): string {
    // Placeholder: apply strategy rules to generate signal
    return dataPoint.price > 0 ? 'HOLD' : 'NO_DATA';
  }
}
