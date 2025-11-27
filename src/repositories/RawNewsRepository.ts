import { RawNews, Prisma, NewsAnalysis } from '@prisma/client';
import prisma from '../db/client.js';

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
