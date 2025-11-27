import { NewsAnalysis, RawNews, Signal, Prisma } from '@prisma/client';
import { MarketSnapshot } from './MarketDataService.js';
import { SignalRepository } from '../repositories/SignalRepository.js';
import { SignalConfigRepository } from '../repositories/SignalConfigRepository.js';
import { AlertService } from './AlertService.js';

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
    private readonly alertService = new AlertService()
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
    const retScore = this.normalizeMetric(marketSnapshot?.ret_1h, 0.1);
    const volumeScore = this.normalizeMetric(marketSnapshot?.volume_ratio_1h, 3);
    const volatilityScore = this.normalizeMetric(marketSnapshot?.volatility_ratio_1h, 3);

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

  async score(rawNews: RawNews, analysis: NewsAnalysis, marketSnapshot?: MarketSnapshot): Promise<{ signal: Signal }> {
    const config = await this.signalConfigRepository.getActiveConfig();
    const { score, breakdown } = this.calculateImpactScore(analysis, marketSnapshot, config.weights as Record<string, number>);
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
