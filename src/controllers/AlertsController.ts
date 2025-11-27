import { Request, Response } from 'express';
import { AlertRepository } from '../repositories/AlertRepository.js';

export class AlertsController {
  constructor(private readonly alertRepository = new AlertRepository()) {}

  list = async (req: Request, res: Response) => {
    const { symbol, from, to, severity, limit, offset } = req.query;
    const alerts = await this.alertRepository.list({
      symbol: typeof symbol === 'string' ? symbol : undefined,
      from: typeof from === 'string' ? new Date(from) : undefined,
      to: typeof to === 'string' ? new Date(to) : undefined,
      severity: typeof severity === 'string' ? severity : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    res.json({ data: alerts });
  };

  getById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const alert = await this.alertRepository.findById(id);
    if (!alert) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(alert);
  };
}
