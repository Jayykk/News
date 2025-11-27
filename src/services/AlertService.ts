export type Alert = {
  message: string;
  createdAt: Date;
};

export class AlertService {
  createAlert(message: string): Alert {
    return {
      message,
      createdAt: new Date(),
    };
  }
}
