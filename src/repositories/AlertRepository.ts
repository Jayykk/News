import { Alert } from '../services/AlertService.js';

export class AlertRepository {
  private alerts: Alert[] = [];

  save(alert: Alert): void {
    this.alerts.push(alert);
  }

  findAll(): Alert[] {
    return [...this.alerts];
  }
}
