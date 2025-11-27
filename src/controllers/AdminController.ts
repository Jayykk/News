import { Request, Response } from 'express';
import { RawNewsRepository } from '../repositories/RawNewsRepository.js';
import { NewsAnalysisService } from '../services/NewsAnalysisService.js';
import { MarketDataService } from '../services/MarketDataService.js';
import { SignalService } from '../services/SignalService.js';

export class AdminController {
  constructor(
    private readonly rawNewsRepository = new RawNewsRepository(),
    private readonly newsAnalysisService = new NewsAnalysisService(),
    private readonly marketDataService = new MarketDataService(),
    private readonly signalService = new SignalService()
  ) {}

  reanalyze = async (req: Request, res: Response) => {
    const { id } = req.params;
    const rawNews = await this.rawNewsRepository.findById(id);
    if (!rawNews) {
      res.status(404).json({ error: 'Raw news not found' });
      return;
    }

    const analysis = await this.newsAnalysisService.analyze(rawNews);
    const [snapshot] = this.marketDataService.fetchSnapshot(rawNews.symbolsRaw ?? []);
    const { signal } = await this.signalService.score(rawNews, analysis, snapshot);

    res.json({ status: 're-analyzed', analysisId: analysis.id, signalId: signal.id });
  };
}
