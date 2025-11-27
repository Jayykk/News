export interface NewsItemInput {
  source: string;
  title: string;
  content: string;
  url: string;
  publishedAt: Date;
  symbolsRaw?: string[];
  language?: string;
}

export interface INewsCollector {
  fetchLatestNews(since: Date | null): Promise<NewsItemInput[]>;
}
