import { Logger } from 'traceability';
import { WebSocketServer } from 'ws';
import { INotificationSocketGateway } from '../../domain/notification/interfaces/notification-socket.interface';

export class NotificationSocketGateway implements INotificationSocketGateway {
  private static instance?: NotificationSocketGateway;
  private readonly server: WebSocketServer;

  private constructor(private readonly port = Number(process.env.WS_PORT) || 3002) {
    this.server = new WebSocketServer({ port });
    this.server.on('connection', (socket) => {
      Logger.info('WebSocket client connected', {
        port,
        clients: this.server.clients.size,
      });
      socket.on('close', () =>
        Logger.info('WebSocket client disconnected', {
          port,
          clients: this.server.clients.size,
        }),
      );
    });
    this.server.on('error', (error) =>
      Logger.error('WebSocket server error', { port, error: error.message }),
    );
    Logger.info('WebSocket gateway listening', { port });
  }

  static getInstance(): NotificationSocketGateway {
    if (!NotificationSocketGateway.instance) {
      NotificationSocketGateway.instance = new NotificationSocketGateway();
    }
    return NotificationSocketGateway.instance;
  }

  broadcastNotification(payload: Record<string, unknown>): void {
    const message = JSON.stringify(payload);
    let recipients = 0;
    this.server.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(message);
        recipients += 1;
      }
    });
    Logger.info('WebSocket event broadcasted', {
      type: payload.type,
      recipients,
      connectedClients: this.server.clients.size,
    });
  }
}
