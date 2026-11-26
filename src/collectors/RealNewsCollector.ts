import { INewsCollector, NewsItemInput } from './INewsCollector.js';
import { getConfig } from '../config/index.js';

/**
 * A generic HTTP-based news collector that maps a JSON array into the internal NewsItemInput shape.
 * The expected payload is illustrative only and should be adjusted to the actual provider via the
 * mapApiPayload function.
 */
export class RealNewsCollector implements INewsCollector {
  private readonly config = getConfig();

  private mapApiPayload(payload: any): NewsItemInput[] {
    if (!Array.isArray(payload)) return [];

    return payload
      .map((item) => {
        const publishedAt = item.published_at ?? item.publishedAt ?? item.time ?? item.date;
        const parsedDate = publishedAt ? new Date(publishedAt) : new Date();

        const mapped: NewsItemInput = {
          source: this.config.newsApiSourceName ?? 'generic_http_api',
          title: item.title ?? 'untitled',
          content: item.content ?? item.summary ?? '',
          url: item.url ?? item.link ?? '',
          publishedAt: parsedDate,
          language: item.language ?? undefined,
          symbolsRaw: Array.isArray(item.symbols) ? item.symbols : undefined,
        };

        return mapped;
      })
      .filter((item) => Boolean(item.title) && Boolean(item.content));
  }

  async fetchLatestNews(since: Date | null): Promise<NewsItemInput[]> {
    if (!this.config.newsApiUrl) {
      // eslint-disable-next-line no-console
      console.warn('NEWS_API_URL not provided; skipping real news collection');
      return [];
    }

    const lookbackMinutes = this.config.newsLookbackMinutes ?? 60;
    const from = since ?? new Date(Date.now() - lookbackMinutes * 60 * 1000);
    const url = new URL(this.config.newsApiUrl);

    url.searchParams.set('from', from.toISOString());

    const headers: Record<string, string> = {};
    if (this.config.newsApiKey) {
      headers.Authorization = `Bearer ${this.config.newsApiKey}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch real news', response.status, response.statusText);
      return [];
    }

    let json: any;
    try {
      json = await response.json();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to parse news API response', error);
      return [];
    }

    return this.mapApiPayload(json);
  }
}
