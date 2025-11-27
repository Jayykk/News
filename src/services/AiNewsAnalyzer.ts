import { env } from 'process';
import { Prisma } from '@prisma/client';
import { OpenAiClient } from '../infra/llm/OpenAiClient.js';

export type AiNewsAnalysisInput = {
  newsId: string;
  title: string;
  content: string;
  source?: string;
  publishedAt?: Date | null;
  assets?: Prisma.InputJsonValue | null;
  eventType?: string | null;
  sentiment?: string | null;
};

export type AiNewsAnalysisResult = {
  veracityLevel: string;
  veracityConfidence: number;
  impactPolarity: string;
  impactMagnitude: string;
  predictedDirection: string;
  predictedHorizon: string;
  predictedAbsMove1h?: number | null;
  keyReasons: string[];
  aiModel?: string;
  aiRaw?: Prisma.InputJsonValue;
};

const PROMPT_TEMPLATE = (
  input: AiNewsAnalysisInput,
) => `You are an AI financial news analyst. Analyze the following news and respond with JSON only, no markdown or comments.
Return JSON with keys: veracity_level (official|multi_source|single_source|rumor), veracity_confidence (0-1 float), impact_polarity (bullish|bearish|neutral), impact_magnitude (minor|moderate|major), predicted_direction (up|down|uncertain), predicted_horizon (minutes|hours|days), predicted_abs_move_1h (float, optional), key_reasons (string array). Include ai_model you used.
News:
- id: ${input.newsId}
- source: ${input.source ?? 'unknown'}
- published_at: ${input.publishedAt ?? 'unknown'}
- title: ${input.title}
- content: ${input.content?.slice(0, 2000)}
- preliminary_assets: ${JSON.stringify(input.assets ?? {})}
- preliminary_event_type: ${input.eventType ?? 'unknown'}
- preliminary_sentiment: ${input.sentiment ?? 'neutral'}
Respond ONLY with JSON.`;

export class AiNewsAnalyzer {
  constructor(private readonly llmClient = new OpenAiClient()) {}

  private useAi(): boolean {
    return env.USE_AI_ANALYSIS === 'true' && this.llmClient.isConfigured();
  }

  private buildFallback(input: AiNewsAnalysisInput): AiNewsAnalysisResult {
    const basePolarity = input.sentiment?.includes('negative') ? 'bearish' : input.sentiment?.includes('positive') ? 'bullish' : 'neutral';
    const magnitude = input.title.length > 120 || (input.content?.length ?? 0) > 400 ? 'major' : 'moderate';
    return {
      veracityLevel: 'single_source',
      veracityConfidence: 0.45,
      impactPolarity: basePolarity,
      impactMagnitude: magnitude,
      predictedDirection: basePolarity === 'bullish' ? 'up' : basePolarity === 'bearish' ? 'down' : 'uncertain',
      predictedHorizon: 'hours',
      predictedAbsMove1h: null,
      keyReasons: ['Fallback rule-based AI disabled or unavailable'],
      aiModel: this.llmClient.isConfigured() ? env.AI_MODEL_NAME ?? 'gpt-4.1-mini' : undefined,
      aiRaw: undefined,
    };
  }

  private parseJson(content: string): any | null {
    try {
      return JSON.parse(content);
    } catch (err) {
      const start = content.indexOf('{');
      const end = content.lastIndexOf('}');
      if (start >= 0 && end > start) {
        try {
          return JSON.parse(content.slice(start, end + 1));
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  private normalizeResult(raw: any, fallback: AiNewsAnalysisResult, aiModel?: string): AiNewsAnalysisResult {
    const keyReasons = Array.isArray(raw?.key_reasons)
      ? raw.key_reasons.map((r: unknown) => String(r)).filter(Boolean)
      : fallback.keyReasons;

    return {
      veracityLevel: String(raw?.veracity_level ?? fallback.veracityLevel),
      veracityConfidence: Number(raw?.veracity_confidence ?? fallback.veracityConfidence),
      impactPolarity: String(raw?.impact_polarity ?? fallback.impactPolarity),
      impactMagnitude: String(raw?.impact_magnitude ?? fallback.impactMagnitude),
      predictedDirection: String(raw?.predicted_direction ?? fallback.predictedDirection),
      predictedHorizon: String(raw?.predicted_horizon ?? fallback.predictedHorizon),
      predictedAbsMove1h: raw?.predicted_abs_move_1h !== undefined && raw?.predicted_abs_move_1h !== null
        ? Number(raw.predicted_abs_move_1h)
        : fallback.predictedAbsMove1h,
      keyReasons,
      aiModel: String(raw?.ai_model ?? aiModel ?? fallback.aiModel ?? '') || undefined,
      aiRaw: raw as Prisma.InputJsonValue,
    };
  }

  async analyze(input: AiNewsAnalysisInput): Promise<AiNewsAnalysisResult> {
    const fallback = this.buildFallback(input);
    if (!this.useAi()) {
      return fallback;
    }

    try {
      const prompt = PROMPT_TEMPLATE(input);
      const llmResponse = await this.llmClient.complete(prompt);
      const parsed = this.parseJson(llmResponse.content);
      if (!parsed) {
        return fallback;
      }
      return this.normalizeResult(parsed, fallback, llmResponse.model);
    } catch (error) {
      console.warn('AI analysis failed, falling back to rule-based result', error);
      return fallback;
    }
  }
}
