export interface INotificationSocketGateway {
  broadcastNotification(payload: Record<string, unknown>): void;
}
