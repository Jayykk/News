import { Router } from 'express';
import { StatsController } from '../controllers/StatsController.js';

const controller = new StatsController();
export const statsRouter = Router();

statsRouter.get('/overview', controller.overview);
statsRouter.get('/top-symbols', controller.topSymbols);
