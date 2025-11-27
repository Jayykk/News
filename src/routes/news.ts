import { Router } from 'express';
import { NewsController } from '../controllers/NewsController.js';

const controller = new NewsController();

export const newsRouter = Router();

newsRouter.get('/', controller.list);
newsRouter.get('/:id', controller.getById);
