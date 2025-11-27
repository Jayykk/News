import { RawNews, Prisma, NewsAnalysis } from '@prisma/client';
import prisma from '../db/client.js';
import { NewsItemInput } from '../collectors/INewsCollector.js';
import { sha256 } from '../utils/hash.js';

export type RawNewsListParams = {
  symbol?: string;
  limit?: number;
  offset?: number;
  source?: string;
  from?: Date;
  to?: Date;
};

export class RawNewsRepository {
  async create(data: Prisma.RawNewsCreateInput): Promise<RawNews> {
    return prisma.rawNews.create({ data });
  }

  async findByHash(hash: string): Promise<RawNews | null> {
    return prisma.rawNews.findFirst({ where: { hash } });
  }

  private buildHash(input: NewsItemInput): string {
    return sha256(`${input.source}|${input.title}|${input.publishedAt.toISOString()}`);
  }

  async insertIfNotExists(input: NewsItemInput): Promise<RawNews> {
    const hash = this.buildHash(input);
    const existing = await this.findByHash(hash);
    if (existing) return existing;

    return this.create({
      source: input.source,
      title: input.title,
      content: input.content,
      url: input.url,
      publishedAt: input.publishedAt,
      symbolsRaw: input.symbolsRaw ?? [],
      language: input.language,
      hash,
    });
  }

  async list(params: RawNewsListParams = {}): Promise<RawNews[]> {
    const { symbol, limit = 50, offset = 0, source, from, to } = params;
    const where: Prisma.RawNewsWhereInput = {};
    if (symbol) {
      where.symbolsRaw = { has: symbol };
    }
    if (source) {
      where.source = source;
    }
    if (from || to) {
      where.publishedAt = {};
      if (from) where.publishedAt.gte = from;
      if (to) where.publishedAt.lte = to;
    }

    return prisma.rawNews.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async listWithLatestAnalysis(params: RawNewsListParams = {}): Promise<(RawNews & { analyses: NewsAnalysis[] })[]> {
    const items = await prisma.rawNews.findMany({
      where: {
        symbolsRaw: params.symbol ? { has: params.symbol } : undefined,
        source: params.source,
        publishedAt: params.from || params.to ? {
          gte: params.from,
          lte: params.to,
        } : undefined,
      },
      orderBy: { publishedAt: 'desc' },
      take: params.limit ?? 50,
      skip: params.offset ?? 0,
      include: {
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    return items;
  }

  async findById(id: string): Promise<RawNews | null> {
    return prisma.rawNews.findUnique({ where: { id } });
  }

  async findLatestCollected(): Promise<RawNews | null> {
    return prisma.rawNews.findFirst({
      orderBy: [{ collectedAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findWithAnalysis(id: string) {
    return prisma.rawNews.findUnique({
      where: { id },
      include: {
        analyses: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async listUnanalysed(limit = 50) {
    return prisma.rawNews.findMany({
      where: {
        analyses: { none: {} },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }
}
