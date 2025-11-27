import { Router } from 'express';
import { NewsAnalysisService } from '../services/NewsAnalysisService.js';
import { NewsRepository } from '../repositories/NewsRepository.js';

const newsRepository = new NewsRepository();
const analysisService = new NewsAnalysisService();

export const newsRouter = Router();

newsRouter.get('/', (_req, res) => {
  const articles = newsRepository.findLatest();
  res.json({ articles });
});

newsRouter.post('/analyze', (req, res) => {
  const { content = '' } = req.body ?? {};
  const result = analysisService.analyzeArticle(String(content));
  res.json({ result });
});
