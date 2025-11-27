import { Alert, NewsAnalysis, RawNews, Signal } from '@prisma/client';
import { AlertRepository } from '../repositories/AlertRepository.js';

const DISCLAIMER = '僅供資訊參考，非投資建議。';

export class AlertService {
  constructor(private readonly alertRepository = new AlertRepository()) {}

  private deriveSeverity(score: number, thresholds: Record<string, number>): string {
    if (score >= (thresholds.severe_alert ?? 0.8)) return 'critical';
    if (score >= (thresholds.impact_alert ?? 0.6)) return 'high';
    return 'info';
  }

  private buildSummary(rawNews: RawNews, analysis: NewsAnalysis, signal: Signal, severity: string): string {
    const sentimentLabel = analysis.sentiment ?? 'neutral';
    const eventLabel = analysis.eventType ?? 'headline';
    const assetsFromAnalysis = (analysis.assets as any)?.symbols;
    const assets = Array.isArray(assetsFromAnalysis) ? assetsFromAnalysis : rawNews.symbolsRaw;
    const assetsStr = assets?.length ? assets.join(',') : '多個資產';
    const direction = signal.impactScore >= 0.5 ? '偏多' : '偏空';
    return `事件：${eventLabel}（情緒：${sentimentLabel}） | 標的：${assetsStr} | 影響分數：${signal.impactScore} (${severity}) | 方向：${direction}. ${DISCLAIMER}`;
  }

  async createAlert(
    rawNews: RawNews,
    analysis: NewsAnalysis,
    signal: Signal,
    thresholds: Record<string, number>
  ): Promise<Alert> {
    const severity = this.deriveSeverity(signal.impactScore, thresholds);
    const summary = this.buildSummary(rawNews, analysis, signal, severity);

    return this.alertRepository.create({
      impactScore: signal.impactScore,
      severity,
      summary,
      status: 'pending',
      disclaimer: DISCLAIMER,
      rawNews: { connect: { id: rawNews.id } },
      analysis: { connect: { id: analysis.id } },
      signal: { connect: { id: signal.id } },
    });
  }
}
