import { Router } from 'express';
import { AlertService } from '../services/AlertService.js';
import { AlertRepository } from '../repositories/AlertRepository.js';

const alertService = new AlertService();
const alertRepository = new AlertRepository();

export const alertsRouter = Router();

alertsRouter.post('/', (req, res) => {
  const { message = 'New alert' } = req.body ?? {};
  const alert = alertService.createAlert(String(message));
  alertRepository.save(alert);
  res.status(201).json(alert);
});

alertsRouter.get('/', (_req, res) => {
  const alerts = alertRepository.findAll();
  res.json({ alerts });
});
