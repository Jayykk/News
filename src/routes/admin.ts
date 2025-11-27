import { Router } from 'express';
import { AdminController } from '../controllers/AdminController.js';

const controller = new AdminController();

export const adminRouter = Router();

adminRouter.post('/re-analyze-news/:id', controller.reanalyze);
