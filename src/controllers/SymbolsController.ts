import { Request, Response } from 'express';
import { StatsService } from '../services/StatsService.js';

export class SymbolsController {
  constructor(private readonly statsService = new StatsService()) {}

  summary = async (req: Request, res: Response) => {
    const { symbol } = req.params;
    if (!symbol) {
      res.status(400).json({ error: 'symbol is required' });
      return;
    }
    const { from, to } = req.query;
    const range = {
      from: typeof from === 'string' ? new Date(from) : undefined,
      to: typeof to === 'string' ? new Date(to) : undefined,
    };
    const summary = await this.statsService.getSymbolSummary(symbol, range);
    res.json(summary);
  };
}
