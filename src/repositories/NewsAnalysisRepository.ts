import { NewsAnalysis, Prisma } from '@prisma/client';
import prisma from '../db/client.js';

export class NewsAnalysisRepository {
  async upsert(
    rawNewsId: string,
    data: Prisma.NewsAnalysisCreateWithoutRawNewsInput
  ): Promise<NewsAnalysis> {
    return prisma.newsAnalysis.upsert({
      where: { rawNewsId },
      update: data,
      create: { ...data, rawNews: { connect: { id: rawNewsId } } },
    });
  }

  async findLatestByRawNewsId(rawNewsId: string): Promise<NewsAnalysis | null> {
    return prisma.newsAnalysis.findUnique({ where: { rawNewsId } });
  }
}
