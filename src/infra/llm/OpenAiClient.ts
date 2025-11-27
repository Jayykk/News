import { env } from 'process';

export type LlmResponse = {
  content: string;
  raw: unknown;
  model?: string;
};

export class OpenAiClient {
  private readonly apiKey = env.AI_API_KEY;

  private readonly apiEndpoint = env.AI_API_ENDPOINT ?? 'https://api.openai.com/v1/chat/completions';

  private readonly modelName = env.AI_MODEL_NAME ?? 'gpt-4.1-mini';

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async complete(prompt: string): Promise<LlmResponse> {
    if (!this.apiKey) {
      throw new Error('AI_API_KEY is not configured');
    }

    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content:
              'You are an AI assistant that evaluates financial news. Always return strictly formatted JSON without any preface or markdown.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`LLM request failed: ${response.status} ${errorBody}`);
    }

    const json = (await response.json()) as { choices?: { message?: { content?: string } }[]; model?: string };
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from LLM');
    }

    return { content, raw: json, model: json.model ?? this.modelName };
  }
}
