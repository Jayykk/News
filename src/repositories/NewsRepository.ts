export type NewsArticle = {
  id: string;
  title: string;
  content: string;
  publishedAt: Date;
};

export class NewsRepository {
  private articles: NewsArticle[] = [];

  save(article: NewsArticle): void {
    this.articles.push(article);
  }

  findLatest(limit = 10): NewsArticle[] {
    return this.articles.slice(-limit).reverse();
  }
}
