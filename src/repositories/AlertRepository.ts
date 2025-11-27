import { Prisma, Alert } from '@prisma/client';
import prisma from '../db/client.js';

export type AlertListParams = {
  symbol?: string;
  from?: Date;
  to?: Date;
  severity?: string;
  limit?: number;
  offset?: number;
};

export class AlertRepository {
  async create(data: Prisma.AlertCreateInput): Promise<Alert> {
    return prisma.alert.create({ data });
  }

  async findById(id: string) {
    return prisma.alert.findUnique({
      where: { id },
      include: {
        analysis: true,
        rawNews: true,
        signal: true,
      },
    });
  }

  async list(params: AlertListParams = {}) {
    const where: Prisma.AlertWhereInput = {};
    if (params.severity) where.severity = params.severity;
    if (params.from || params.to) {
      where.createdAt = {};
      if (params.from) where.createdAt.gte = params.from;
      if (params.to) where.createdAt.lte = params.to;
    }
    if (params.symbol) {
      where.rawNews = { symbolsRaw: { has: params.symbol } };
    }

    return prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params.limit ?? 50,
      skip: params.offset ?? 0,
      include: {
        rawNews: true,
        analysis: true,
        signal: true,
      },
    });
  }
}
