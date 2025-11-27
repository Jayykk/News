import { AlertRepository } from '../repositories/AlertRepository.js';

export type TimeRange = { from?: Date; to?: Date };

export type OverviewStatsResponse = {
  totalAlerts: number;
  majorBullish: number;
  majorBearish: number;
  rumorCount: number;
  officialCount: number;
  multiSourceCount: number;
  bullishBearishTimeline: { bucket: string; bullish: number; bearish: number }[];
};

export type TopSymbolResponse = { symbol: string; total: number; bullish: number; bearish: number }[];

export type SymbolSummaryResponse = {
  symbol: string;
  from?: string;
  to?: string;
  majorBullish: number;
  majorBearish: number;
  sentimentTilt: 'bullish' | 'bearish' | 'neutral';
  distribution: { bullish: number; bearish: number; neutral: number };
  veracityCounts: { official: number; rumor: number; multiSource: number; singleSource: number };
  timeline: { timestamp: string; impactScore: number; polarity?: string | null; direction?: string | null }[];
};

type AlertWithRelations = Awaited<ReturnType<AlertRepository['list']>>;

export class StatsService {
  constructor(private readonly alertRepository = new AlertRepository()) {}

  private bucketByHour(date: Date) {
    return `${date.toISOString().slice(0, 13)}:00`;
  }

  private countVeracity(alerts: AlertWithRelations) {
    return alerts.reduce(
      (acc, alert) => {
        const level = alert.analysis?.veracityLevel;
        if (level === 'official') acc.official += 1;
        else if (level === 'multi_source') acc.multiSource += 1;
        else if (level === 'rumor') acc.rumor += 1;
        else if (level) acc.singleSource += 1;
        return acc;
      },
      { official: 0, rumor: 0, multiSource: 0, singleSource: 0 }
    );
  }

  async getOverview(range: TimeRange): Promise<OverviewStatsResponse> {
    const alerts = await this.alertRepository.list({ from: range.from, to: range.to, limit: 500 });
    const timelineMap = new Map<string, { bullish: number; bearish: number }>();

    let majorBullish = 0;
    let majorBearish = 0;
    for (const alert of alerts) {
      const bucket = alert.createdAt ? this.bucketByHour(alert.createdAt) : 'unknown';
      if (!timelineMap.has(bucket)) timelineMap.set(bucket, { bullish: 0, bearish: 0 });
      const timeline = timelineMap.get(bucket)!;
      if (alert.analysis?.impactPolarity === 'bullish') timeline.bullish += 1;
      if (alert.analysis?.impactPolarity === 'bearish') timeline.bearish += 1;
      if (alert.analysis?.impactPolarity === 'bullish' && alert.analysis?.impactMagnitude === 'major') majorBullish += 1;
      if (alert.analysis?.impactPolarity === 'bearish' && alert.analysis?.impactMagnitude === 'major') majorBearish += 1;
    }

    const veracityCounts = this.countVeracity(alerts);

    return {
      totalAlerts: alerts.length,
      majorBullish,
      majorBearish,
      rumorCount: veracityCounts.rumor,
      officialCount: veracityCounts.official,
      multiSourceCount: veracityCounts.multiSource,
      bullishBearishTimeline: Array.from(timelineMap.entries())
        .map(([bucket, counts]) => ({ bucket, ...counts }))
        .sort((a, b) => a.bucket.localeCompare(b.bucket)),
    };
  }

  async getTopSymbols(range: TimeRange, limit = 10): Promise<TopSymbolResponse> {
    // For Phase 1 we load a bounded set of alerts and aggregate on the server to avoid extra Prisma complexity.
    const alerts = await this.alertRepository.list({ from: range.from, to: range.to, limit: 800 });
    const counts: Record<string, { total: number; bullish: number; bearish: number }> = {};

    for (const alert of alerts) {
      const symbols = alert.rawNews?.symbolsRaw ?? [];
      symbols.forEach((symbol) => {
        if (!counts[symbol]) counts[symbol] = { total: 0, bullish: 0, bearish: 0 };
        counts[symbol].total += 1;
        if (alert.analysis?.impactPolarity === 'bullish') counts[symbol].bullish += 1;
        if (alert.analysis?.impactPolarity === 'bearish') counts[symbol].bearish += 1;
      });
    }

    return Object.entries(counts)
      .map(([symbol, value]) => ({ symbol, ...value }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }

  async getSymbolSummary(symbol: string, range: TimeRange): Promise<SymbolSummaryResponse> {
    const alerts = await this.alertRepository.list({ symbol, from: range.from, to: range.to, limit: 800 });
    const veracityCounts = this.countVeracity(alerts);
    const distribution = alerts.reduce(
      (acc, alert) => {
        const polarity = alert.analysis?.impactPolarity;
        if (polarity === 'bullish') acc.bullish += 1;
        else if (polarity === 'bearish') acc.bearish += 1;
        else acc.neutral += 1;
        return acc;
      },
      { bullish: 0, bearish: 0, neutral: 0 }
    );

    const majorBullish = alerts.filter(
      (a) => a.analysis?.impactPolarity === 'bullish' && a.analysis?.impactMagnitude === 'major'
    ).length;
    const majorBearish = alerts.filter(
      (a) => a.analysis?.impactPolarity === 'bearish' && a.analysis?.impactMagnitude === 'major'
    ).length;

    const tilt: SymbolSummaryResponse['sentimentTilt'] =
      majorBullish > majorBearish ? 'bullish' : majorBearish > majorBullish ? 'bearish' : 'neutral';

    const timeline = alerts.map((alert) => ({
      timestamp: alert.createdAt?.toISOString?.() ?? new Date().toISOString(),
      impactScore: alert.impactScore,
      polarity: alert.analysis?.impactPolarity,
      direction: alert.analysis?.predictedDirection,
    }));

    return {
      symbol,
      from: range.from?.toISOString(),
      to: range.to?.toISOString(),
      majorBullish,
      majorBearish,
      sentimentTilt: tilt,
      distribution,
      veracityCounts,
      timeline,
    };
  }
}
