import { Router } from 'express';
import { AlertsController } from '../controllers/AlertsController.js';

const controller = new AlertsController();

export const alertsRouter = Router();

alertsRouter.get('/', controller.list);
alertsRouter.get('/:id', controller.getById);
