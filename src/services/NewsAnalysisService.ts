import { RawNews, NewsAnalysis, Prisma } from '@prisma/client';
import { NewsAnalysisRepository } from '../repositories/NewsAnalysisRepository.js';
import { RawNewsRepository } from '../repositories/RawNewsRepository.js';

export type AnalysisResultInput = Prisma.NewsAnalysisCreateWithoutRawNewsInput;

type Rule = {
  eventType: string;
  sentiment: string;
  keywords: string[];
  isRumor?: boolean;
  priceDirectionHint?: string;
};

const RULES: Rule[] = [
  {
    eventType: 'hack',
    sentiment: 'very_negative',
    keywords: ['hack', 'attack', 'breach', 'exploit', '駭客'],
    priceDirectionHint: 'down',
  },
  {
    eventType: 'partnership',
    sentiment: 'positive',
    keywords: ['partnership', '合作', 'collaborat', 'allianc'],
    priceDirectionHint: 'up',
  },
  {
    eventType: 'regulation',
    sentiment: 'negative',
    keywords: ['ban', 'lawsuit', 'regulation', 'fine', 'probe'],
    priceDirectionHint: 'down',
  },
  {
    eventType: 'upgrade',
    sentiment: 'positive',
    keywords: ['upgrade', 'launch', 'release', 'roadmap'],
    priceDirectionHint: 'up',
  },
];

const RUMOR_KEYWORDS = ['rumor', 'unconfirmed', '傳言', '傳聞', 'rumour'];

export class NewsAnalysisService {
  constructor(
    private readonly analysisRepository = new NewsAnalysisRepository(),
    private readonly rawNewsRepository = new RawNewsRepository()
  ) {}

  private detectRule(text: string): Rule | null {
    const lower = text.toLowerCase();
    for (const rule of RULES) {
      if (rule.keywords.some((kw) => lower.includes(kw))) {
        return rule;
      }
    }
    return null;
  }

  private detectSentiment(rule: Rule | null): string {
    if (rule) return rule.sentiment;
    return 'neutral';
  }

  private detectRumor(text: string): boolean {
    const lower = text.toLowerCase();
    return RUMOR_KEYWORDS.some((kw) => lower.includes(kw));
  }

  private buildAnalysis(rawNews: RawNews): AnalysisResultInput {
    const text = `${rawNews.title} ${rawNews.content}`;
    const matchedRule = this.detectRule(text);
    const sentiment = this.detectSentiment(matchedRule);
    const isRumor = this.detectRumor(text);
    const priceDirectionHint = matchedRule?.priceDirectionHint ?? (sentiment.includes('negative') ? 'down' : sentiment === 'positive' ? 'up' : 'flat');
    const keyReasons: string[] = [];
    if (matchedRule) keyReasons.push(`Matched rule: ${matchedRule.eventType}`);
    if (isRumor) keyReasons.push('Contains rumor indicator');

    const confidenceBase = matchedRule ? 0.7 : 0.4;
    const confidence = isRumor ? confidenceBase * 0.6 : confidenceBase;

    return {
      assets: { symbols: rawNews.symbolsRaw ?? [] } as Prisma.InputJsonValue,
      eventType: matchedRule?.eventType ?? 'headline',
      sentiment,
      isRumor,
      isConfirmedByOfficial: !isRumor,
      timeRelevance: 'recent',
      priceDirectionHint,
      keyReasons,
      rawConfidence: Number(confidence.toFixed(3)),
      extra: { matchedRule: matchedRule?.eventType ?? null },
    };
  }

  async analyze(rawNews: RawNews): Promise<NewsAnalysis> {
    const analysisInput = this.buildAnalysis(rawNews);
    return this.analysisRepository.upsert(rawNews.id, analysisInput);
  }

  async analyzePending(batchSize = 50): Promise<NewsAnalysis[]> {
    const pending = await this.rawNewsRepository.listUnanalysed(batchSize);
    const results: NewsAnalysis[] = [];
    for (const raw of pending) {
      // eslint-disable-next-line no-await-in-loop
      const analysis = await this.analyze(raw);
      results.push(analysis);
    }
    return results;
  }

  async reanalyzeByRawNewsId(rawNewsId: string): Promise<NewsAnalysis | null> {
    const raw = await this.rawNewsRepository.findById(rawNewsId);
    if (!raw) return null;
    return this.analyze(raw);
  }
}
