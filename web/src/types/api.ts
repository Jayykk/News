export type RawNews = {
  id: string;
  source: string;
  title: string;
  url?: string | null;
  content: string;
  publishedAt?: string | null;
  collectedAt?: string;
  symbolsRaw?: string[];
};

export type NewsAnalysis = {
  id: string;
  rawNewsId: string;
  assets?: { symbols?: string[] } | null;
  eventType?: string | null;
  sentiment?: string | null;
  isRumor?: boolean | null;
  isConfirmedByOfficial?: boolean | null;
  priceDirectionHint?: string | null;
  veracityLevel?: string | null;
  veracityConfidence?: number | null;
  impactPolarity?: string | null;
  impactMagnitude?: string | null;
  predictedDirection?: string | null;
  predictedHorizon?: string | null;
  predictedAbsMove1h?: number | null;
  keyReasons?: string[] | null;
  createdAt?: string;
};

export type Signal = {
  id: string;
  impactScore: number;
};

export type Alert = {
  id: string;
  signalId: string;
  rawNewsId: string;
  newsAnalysisId?: string | null;
  impactScore: number;
  severity: string;
  summary: string;
  status: string;
  disclaimer?: string | null;
  createdAt: string;
  updatedAt?: string;
  rawNews?: RawNews | null;
  analysis?: NewsAnalysis | null;
  signal?: Signal | null;
};

export type OverviewTimeseriesPoint = {
  bucket: string;
  bullish: number;
  bearish: number;
};

export type OverviewStats = {
  totalAlerts: number;
  majorBullish: number;
  majorBearish: number;
  rumorCount: number;
  officialCount: number;
  multiSourceCount: number;
  bullishBearishTimeline: OverviewTimeseriesPoint[];
};

export type TopSymbolStat = {
  symbol: string;
  total: number;
  bullish: number;
  bearish: number;
};

export type SymbolSummary = {
  symbol: string;
  from?: string;
  to?: string;
  majorBullish: number;
  majorBearish: number;
  sentimentTilt: 'bullish' | 'bearish' | 'neutral';
  distribution: {
    bullish: number;
    bearish: number;
    neutral: number;
  };
  veracityCounts: {
    official: number;
    rumor: number;
    multiSource: number;
    singleSource: number;
  };
  timeline: {
    timestamp: string;
    impactScore: number;
    polarity?: string | null;
    direction?: string | null;
  }[];
};
