import { Logger } from 'traceability';
import { WebSocketServer } from 'ws';
import { Server as HttpServer } from 'http';
import { INotificationSocketGateway } from '../../domain/notification/interfaces/notification-socket.interface';

export class NotificationSocketGateway implements INotificationSocketGateway {
  private static instance?: NotificationSocketGateway;
  private readonly server: WebSocketServer;
  private attached = false;

  private constructor() {
    this.server = new WebSocketServer({ noServer: true });
    this.server.on('connection', (socket) => {
      Logger.info('WebSocket client connected', {
        clients: this.server.clients.size,
      });
      socket.on('close', () =>
        Logger.info('WebSocket client disconnected', {
          clients: this.server.clients.size,
        }),
      );
    });
    this.server.on('error', (error) =>
      Logger.error('WebSocket server error', { error: error.message }),
    );
  }

  static getInstance(): NotificationSocketGateway {
    if (!NotificationSocketGateway.instance) {
      NotificationSocketGateway.instance = new NotificationSocketGateway();
    }
    return NotificationSocketGateway.instance;
  }

  attachHttpServer(httpServer: HttpServer): void {
    if (this.attached) return;
    this.attached = true;
    httpServer.on('upgrade', (request, socket, head) => {
      this.server.handleUpgrade(request, socket, head, (ws) => {
        this.server.emit('connection', ws, request);
      });
    });
    Logger.info('WebSocket gateway attached to HTTP server');
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
