import fs from 'fs/promises';
import { Prisma, SignalConfig } from '@prisma/client';
import prisma from '../db/client.js';
import { getConfig } from '../config/index.js';

export class SignalConfigRepository {
  private readonly configPath: string;

  constructor(configPath?: string) {
    const appConfig = getConfig();
    this.configPath = configPath ?? appConfig.signalConfigPath;
  }

  private async seedFromFile(): Promise<SignalConfig> {
    const content = await fs.readFile(this.configPath, 'utf-8');
    const parsed = JSON.parse(content);
    return prisma.signalConfig.create({
      data: {
        name: parsed.name,
        description: parsed.description,
        weights: parsed.weights as Prisma.InputJsonValue,
        thresholds: parsed.thresholds as Prisma.InputJsonValue,
        isActive: true,
      },
    });
  }

  async getActiveConfig(): Promise<SignalConfig> {
    const existing = await prisma.signalConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) return existing;
    return this.seedFromFile();
  }
}
