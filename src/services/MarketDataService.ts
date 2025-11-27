import { getConfig } from '../config/index.js';

export interface MarketSnapshot {
  symbol: string;
  assetType: 'stock' | 'crypto';
  priceNow: number;
  ret5m?: number;
  ret1h?: number;
  volumeRatio1h?: number;
  volatilityRatio1h?: number;
  observedAt: Date;
}

/**
 * Generic market data fetcher with stub and real modes. Real mode expects a JSON payload similar to:
 * [{ "symbol": "BTC", "price": 68000, "ret_1h": 0.01, "volume_ratio_1h": 1.2 }]
 * The actual mapping should be adjusted based on the provider response structure.
 */
export class MarketDataService {
  private readonly config = getConfig();

  buildStubSnapshot(symbol: string, assetType: 'stock' | 'crypto' = 'stock'): MarketSnapshot {
    const randomWithin = (min: number, max: number) => Math.random() * (max - min) + min;
    return {
      symbol,
      assetType,
      priceNow: Number(randomWithin(10, 500).toFixed(2)),
      ret5m: Number(randomWithin(-0.03, 0.03).toFixed(4)),
      ret1h: Number(randomWithin(-0.05, 0.05).toFixed(4)),
      volumeRatio1h: Number(randomWithin(0.5, 2.5).toFixed(2)),
      volatilityRatio1h: Number(randomWithin(0.5, 2.5).toFixed(2)),
      observedAt: new Date(),
    };
  }

  private mapApiPayload(data: any, symbol: string, assetType: 'stock' | 'crypto'): MarketSnapshot | null {
    if (!data) return null;
    const price = data.price ?? data.priceNow ?? data.last ?? data.close;
    if (price === undefined) return null;
    return {
      symbol,
      assetType,
      priceNow: Number(price),
      ret5m: data.ret_5m ?? data.ret5m ?? undefined,
      ret1h: data.ret_1h ?? data.ret1h ?? undefined,
      volumeRatio1h: data.volume_ratio_1h ?? data.volumeRatio1h ?? undefined,
      volatilityRatio1h: data.volatility_ratio_1h ?? data.volatilityRatio1h ?? undefined,
      observedAt: data.observed_at ? new Date(data.observed_at) : new Date(),
    };
  }

  async getLatestSnapshot(symbol: string, assetType: 'stock' | 'crypto' = 'stock'): Promise<MarketSnapshot | null> {
    if (this.config.marketDataMode === 'stub') {
      return this.buildStubSnapshot(symbol, assetType);
    }

    if (!this.config.marketDataApiUrl) {
      // eslint-disable-next-line no-console
      console.warn('MARKET_DATA_API_URL not provided; returning null snapshot');
      return null;
    }

    const url = new URL(this.config.marketDataApiUrl);
    url.searchParams.set('symbol', symbol);

    const headers: Record<string, string> = {};
    if (this.config.marketDataApiKey) {
      headers.Authorization = `Bearer ${this.config.marketDataApiKey}`;
    }

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch market data', response.status, response.statusText);
        return null;
      }
      const json = await response.json();
      // If provider returns an array, grab the first element for the requested symbol.
      const payload = Array.isArray(json) ? json[0] : json;
      return this.mapApiPayload(payload, symbol, assetType);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching market data', error);
      return null;
    }
  }
}
