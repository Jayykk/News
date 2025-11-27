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

  private describeImpact(analysis: NewsAnalysis): string {
    const magnitude = analysis.impactMagnitude ?? 'moderate';
    const polarity = analysis.impactPolarity ?? 'neutral';
    const magnitudeText = magnitude === 'major' ? '重大' : magnitude === 'minor' ? '輕微' : '一般';
    const polarityText = polarity === 'bullish' ? '利多' : polarity === 'bearish' ? '利空' : '中性';
    return `${magnitudeText}${polarityText}`;
  }

  private describeDirection(analysis: NewsAnalysis): string {
    const direction = analysis.predictedDirection;
    if (direction === 'up') return '可能上漲';
    if (direction === 'down') return '可能下跌';
    return '方向不明';
  }

  private describeVeracity(analysis: NewsAnalysis): string {
    const level = analysis.veracityLevel ?? (analysis.isRumor ? 'rumor' : 'single_source');
    const confidence = analysis.veracityConfidence ?? analysis.rawConfidence ?? 0.4;
    return `${level} (${Number(confidence * 100).toFixed(0)}%)`;
  }

  private buildSummary(rawNews: RawNews, analysis: NewsAnalysis, signal: Signal, severity: string): string {
    const sentimentLabel = analysis.sentiment ?? 'neutral';
    const eventLabel = analysis.eventType ?? 'headline';
    const assetsFromAnalysis = (analysis.assets as any)?.symbols;
    const assets = Array.isArray(assetsFromAnalysis) ? assetsFromAnalysis : rawNews.symbolsRaw;
    const assetsStr = assets?.length ? assets.join(',') : '多個資產';
    const direction = signal.impactScore >= 0.5 ? '偏多' : '偏空';
    const aiImpact = this.describeImpact(analysis);
    const predictedDirection = this.describeDirection(analysis);
    const veracity = this.describeVeracity(analysis);

    return `事件：${eventLabel}（情緒：${sentimentLabel}） | 標的：${assetsStr} | 影響分數：${signal.impactScore} (${severity}) | 方向：${direction} | AI判斷：${aiImpact} | 預估方向：${predictedDirection} | 可信度：${veracity}. ${DISCLAIMER}`;
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
