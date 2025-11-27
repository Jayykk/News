import { NewsAnalysis, RawNews, Signal, Prisma } from '@prisma/client';
import { MarketSnapshot, MarketDataService } from './MarketDataService.js';
import { SignalRepository } from '../repositories/SignalRepository.js';
import { SignalConfigRepository } from '../repositories/SignalConfigRepository.js';
import { AlertService } from './AlertService.js';
import { getConfig } from '../config/index.js';

export type ImpactBreakdown = {
  news_score: number;
  ret_1h_score: number;
  volume_score: number;
  volatility_score: number;
};

export class SignalService {
  constructor(
    private readonly signalRepository = new SignalRepository(),
    private readonly signalConfigRepository = new SignalConfigRepository(),
    private readonly alertService = new AlertService(),
    private readonly marketDataService = new MarketDataService(),
    private readonly environment = getConfig()
  ) {}

  private scoreNewsComponent(analysis: NewsAnalysis): number {
    let score = analysis.rawConfidence ?? 0.4;

    if (analysis.impactMagnitude === 'major') score += 0.25;
    else if (analysis.impactMagnitude === 'moderate') score += 0.1;

    if (analysis.impactPolarity === 'bullish' || analysis.impactPolarity === 'bearish') {
      score += 0.05;
    }

    if (analysis.veracityLevel === 'official') score += 0.2;
    else if (analysis.veracityLevel === 'multi_source') score += 0.1;
    else if (analysis.veracityLevel === 'rumor' || analysis.isRumor) score -= 0.2;

    if (analysis.predictedDirection === 'uncertain') {
      score -= 0.05;
    }

    if (analysis.eventType === 'hack' || analysis.sentiment?.includes('negative')) {
      score += 0.1;
    }
    if (analysis.isConfirmedByOfficial) {
      score += 0.05;
    }

    return Math.min(Math.max(score, 0), 1);
  }

  private normalizeMetric(value?: number, cap = 2.5): number {
    if (value === undefined || Number.isNaN(value)) return 0.5;
    const bounded = Math.max(Math.min(value, cap), -cap);
    return Number(((bounded + cap) / (2 * cap)).toFixed(3));
  }

  calculateImpactScore(
    analysis: NewsAnalysis,
    marketSnapshot: MarketSnapshot | undefined,
    weights: Record<string, number>
  ): { score: number; breakdown: ImpactBreakdown } {
    const newsScore = this.scoreNewsComponent(analysis);
    const retScore = this.normalizeMetric(marketSnapshot?.ret1h, 0.1);
    const volumeScore = this.normalizeMetric(marketSnapshot?.volumeRatio1h, 3);
    const volatilityScore = this.normalizeMetric(marketSnapshot?.volatilityRatio1h, 3);

    const breakdown: ImpactBreakdown = {
      news_score: newsScore,
      ret_1h_score: retScore,
      volume_score: volumeScore,
      volatility_score: volatilityScore,
    };

    const score =
      (weights.w_news ?? 0.4) * newsScore +
      (weights.w_ret_1h ?? 0.2) * retScore +
      (weights.w_volume_1h ?? 0.2) * volumeScore +
      (weights.w_volatility_1h ?? 0.2) * volatilityScore;

    return { score: Number(score.toFixed(3)), breakdown };
  }

  private determineStatus(score: number, impactThreshold: number) {
    return score >= impactThreshold ? 'alerted' : 'no_alert';
  }

  private pickAsset(symbols?: string[]): string | null {
    if (!symbols?.length) return null;
    return symbols[0];
  }

  private async resolveMarketSnapshot(
    symbols: string[] | undefined,
    assetType: 'stock' | 'crypto'
  ): Promise<MarketSnapshot | null> {
    const symbol = this.pickAsset(symbols);
    if (!symbol) return null;

    if (this.environment.marketDataMode === 'stub') {
      return this.marketDataService.buildStubSnapshot(symbol, assetType);
    }

    const snapshot = await this.marketDataService.getLatestSnapshot(symbol, assetType);
    if (snapshot) return snapshot;

    // fallback to stub generation to avoid failing the pipeline when real data is missing
    return this.marketDataService.buildStubSnapshot(symbol, assetType);
  }

  async score(
    rawNews: RawNews,
    analysis: NewsAnalysis,
    assetType: 'stock' | 'crypto' = 'stock'
  ): Promise<{ signal: Signal }> {
    const config = await this.signalConfigRepository.getActiveConfig();
    const marketSnapshot = await this.resolveMarketSnapshot(rawNews.symbolsRaw, assetType);
    const { score, breakdown } = this.calculateImpactScore(analysis, marketSnapshot ?? undefined, config.weights as Record<string, number>);
    const impactThreshold = (config.thresholds as Record<string, number>).impact_alert ?? 0.6;
    const status = this.determineStatus(score, impactThreshold);

    const signal = await this.signalRepository.create({
      rawNews: { connect: { id: rawNews.id } },
      analysis: { connect: { id: analysis.id } },
      impactScore: score,
      scoreBreakdown: breakdown,
      thresholdUsed: impactThreshold,
      weightsUsed: config.weights as Prisma.InputJsonValue,
      status,
    });

    if (status === 'alerted') {
      await this.alertService.createAlert(rawNews, analysis, signal, config.thresholds as Record<string, number>);
    }

    return { signal };
  }
}
