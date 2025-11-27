import { Router } from 'express';
import { SymbolsController } from '../controllers/SymbolsController.js';

const controller = new SymbolsController();
export const symbolsRouter = Router();

symbolsRouter.get('/:symbol/summary', controller.summary);
