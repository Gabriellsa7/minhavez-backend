import { Logger } from 'traceability';
import { WebSocketServer } from 'ws';
import { INotificationSocketGateway } from '../../domain/notification/interfaces/notification-socket.interface';

export class NotificationSocketGateway implements INotificationSocketGateway {
  private readonly server: WebSocketServer;

  constructor(port = 3002) {
    this.server = new WebSocketServer({ port });
    this.server.on('connection', (socket) => {
      Logger.info('WebSocket connected', { port });
      socket.on('close', () => Logger.info('WebSocket disconnected', { port }));
    });
  }

  broadcastNotification(payload: Record<string, unknown>): void {
    const message = JSON.stringify(payload);
    this.server.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(message);
      }
    });
  }
}
