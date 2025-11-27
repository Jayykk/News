import { Request, Response } from 'express';
import { RawNewsRepository } from '../repositories/RawNewsRepository.js';

export class NewsController {
  constructor(private readonly rawNewsRepository = new RawNewsRepository()) {}

  list = async (req: Request, res: Response) => {
    const { symbol, limit, offset, source, from, to } = req.query;
    const items = await this.rawNewsRepository.listWithLatestAnalysis({
      symbol: typeof symbol === 'string' ? symbol : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      source: typeof source === 'string' ? source : undefined,
      from: typeof from === 'string' ? new Date(from) : undefined,
      to: typeof to === 'string' ? new Date(to) : undefined,
    });

    res.json({
      data: items.map((n) => ({
        ...n,
        latestAnalysis: n.analyses[0] ?? null,
      })),
      pagination: { limit: limit ? Number(limit) : 50, offset: offset ? Number(offset) : 0 },
    });
  };

  getById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const news = await this.rawNewsRepository.findWithAnalysis(id);
    if (!news) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({ raw: news, analyses: news.analyses });
  };
}
