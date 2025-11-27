import { Prisma, Signal } from '@prisma/client';
import prisma from '../db/client.js';

export type SignalCreateInput = Prisma.SignalCreateInput;

export class SignalRepository {
  async create(data: SignalCreateInput): Promise<Signal> {
    return prisma.signal.create({ data });
  }

  async findById(id: string) {
    return prisma.signal.findUnique({ where: { id } });
  }

  async listByRawNewsId(rawNewsId: string) {
    return prisma.signal.findMany({
      where: { rawNewsId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
