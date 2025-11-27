import { Router, Request, Response } from 'express';
import { AlertService } from '../services/AlertService.js';
import { AlertRepository } from '../repositories/AlertRepository.js';

const alertService = new AlertService();
const alertRepository = new AlertRepository();

export const alertsRouter = Router();

alertsRouter.post('/', (req: Request, res: Response) => {
  const { message = 'New alert' } = req.body ?? {};
  const alert = alertService.createAlert(String(message));
  alertRepository.save(alert);
  res.status(201).json(alert);
});

alertsRouter.get('/', (_req: Request, res: Response) => {
  const alerts = alertRepository.findAll();
  res.json({ alerts });
});
