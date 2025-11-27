import { Request, Response } from 'express';
import { StatsService } from '../services/StatsService.js';

export class StatsController {
  constructor(private readonly statsService = new StatsService()) {}

  overview = async (req: Request, res: Response) => {
    const { from, to } = req.query;
    const range = {
      from: typeof from === 'string' ? new Date(from) : undefined,
      to: typeof to === 'string' ? new Date(to) : undefined,
    };
    const stats = await this.statsService.getOverview(range);
    res.json(stats);
  };

  topSymbols = async (req: Request, res: Response) => {
    const { from, to, limit } = req.query;
    const range = {
      from: typeof from === 'string' ? new Date(from) : undefined,
      to: typeof to === 'string' ? new Date(to) : undefined,
    };
    const parsedLimit = limit ? Number(limit) : 10;
    const data = await this.statsService.getTopSymbols(range, Number.isFinite(parsedLimit) ? parsedLimit : 10);
    res.json({ data });
  };
}
