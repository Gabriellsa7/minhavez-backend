import { Logger } from 'traceability';
import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage, Server as HttpServer } from 'http';
import { Duplex } from 'stream';
import jwt from 'jsonwebtoken';
import {
  INotificationSocketGateway,
  INotificationSocketScope,
} from '../../domain/notification/interfaces/notification-socket.interface';
import {
  EPrincipalType,
  IAuthPayload,
} from '../../domain/auth/interfaces/auth.interface';
import { IQueueRepository } from '../../domain/queue/repository/queue.repository.interface';
import { IPatientRepository } from '../../domain/patient/repository/patient.repository.interface';
import { IHealthUnitRepository } from '../../domain/health-unit/repository/health-unit.repository.interface';
import { QueueRepository } from '../repository/queue/queue.repository';
import { PatientRepository } from '../repository/patient/patient.repository';
import { HealthUnitRepository } from '../repository/health-unit/health-unit.repository';

const TOKEN_EXPIRED_CLOSE_CODE = 4401;
const MAX_TIMER_DELAY_MS = 2_147_483_647;

export interface ISocketAudienceDeps {
  queueRepository: Pick<IQueueRepository, 'getQueueById'>;
  patientRepository: Pick<IPatientRepository, 'getPatientById'>;
  healthUnitRepository: Pick<IHealthUnitRepository, 'getHealthUnitById'>;
}

export interface ISocketAudience {
  healthUnitId?: string;
  userIds: Set<string>;
}

export async function resolveSocketAudience(
  scope: INotificationSocketScope,
  deps: ISocketAudienceDeps,
): Promise<ISocketAudience> {
  let healthUnitId = scope.healthUnitId;
  if (!healthUnitId && scope.queueId) {
    const queue = await deps.queueRepository.getQueueById(scope.queueId);
    healthUnitId = queue?.healthUnitId;
  }

  const patientIds = [...new Set((scope.patientIds ?? []).filter(Boolean))];
  const [patients, healthUnit] = await Promise.all([
    Promise.all(
      patientIds.map((id) => deps.patientRepository.getPatientById(id)),
    ),
    healthUnitId
      ? deps.healthUnitRepository.getHealthUnitById(healthUnitId)
      : null,
  ]);

  const userIds = new Set<string>();
  patients.forEach((patient) => {
    if (patient?.userId) userIds.add(patient.userId.toString());
  });
  if (healthUnit?.userId) userIds.add(healthUnit.userId.toString());

  return { healthUnitId: healthUnitId?.toString(), userIds };
}

export function isSocketRecipient(
  principal: IAuthPayload,
  audience: ISocketAudience,
): boolean {
  if (principal.principalType === EPrincipalType.USER) {
    return audience.userIds.has(principal.sub);
  }

  return (
    !!audience.healthUnitId &&
    principal.healthUnitId?.toString() === audience.healthUnitId
  );
}

function extractToken(request: IncomingMessage): string | null {
  const url = new URL(request.url ?? '', 'http://localhost');
  const queryToken = url.searchParams.get('token');
  if (queryToken) return queryToken;

  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);

  return null;
}

function rejectUpgrade(socket: Duplex, reason: string): void {
  socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
  socket.destroy();
  Logger.info('WebSocket handshake rejected', { reason });
}

export class NotificationSocketGateway implements INotificationSocketGateway {
  private static instance?: NotificationSocketGateway;
  private readonly server: WebSocketServer;
  private readonly principals = new Map<WebSocket, IAuthPayload>();
  private attached = false;

  constructor(private readonly audienceDeps: ISocketAudienceDeps) {
    this.server = new WebSocketServer({ noServer: true });
    this.server.on('error', (error) =>
      Logger.error('WebSocket server error', { error: error.message }),
    );
  }

  static getInstance(): NotificationSocketGateway {
    if (!NotificationSocketGateway.instance) {
      NotificationSocketGateway.instance = new NotificationSocketGateway({
        queueRepository: new QueueRepository(),
        patientRepository: new PatientRepository(),
        healthUnitRepository: new HealthUnitRepository(),
      });
    }
    return NotificationSocketGateway.instance;
  }

  attachHttpServer(httpServer: HttpServer): void {
    if (this.attached) return;
    this.attached = true;
    httpServer.on('upgrade', (request, socket, head) => {
      const token = extractToken(request);
      if (!token) {
        rejectUpgrade(socket, 'missing token');
        return;
      }

      let principal: IAuthPayload;
      try {
        principal = jwt.verify(token, process.env.JWT_SECRET!) as IAuthPayload;
      } catch (error) {
        rejectUpgrade(socket, (error as Error).message);
        return;
      }

      this.server.handleUpgrade(request, socket, head, (ws) => {
        this.registerClient(ws, principal);
      });
    });
    Logger.info('WebSocket gateway attached to HTTP server');
  }

  private registerClient(ws: WebSocket, principal: IAuthPayload): void {
    this.principals.set(ws, principal);

    const msUntilExpiry = principal.exp
      ? Math.max(principal.exp * 1000 - Date.now(), 0)
      : null;
    // setTimeout overflows (fires immediately) past ~24.8 days, so skip the timer for longer tokens.
    const expiryTimer =
      msUntilExpiry !== null && msUntilExpiry <= MAX_TIMER_DELAY_MS
        ? setTimeout(
            () => ws.close(TOKEN_EXPIRED_CLOSE_CODE, 'Token expired'),
            msUntilExpiry,
          )
        : null;

    ws.on('close', () => {
      if (expiryTimer) clearTimeout(expiryTimer);
      this.principals.delete(ws);
      Logger.info('WebSocket client disconnected', {
        clients: this.principals.size,
      });
    });

    Logger.info('WebSocket client connected', {
      principalType: principal.principalType,
      clients: this.principals.size,
    });
  }

  broadcastNotification(
    payload: Record<string, unknown>,
    scope: INotificationSocketScope,
  ): void {
    // Processes without an attached server (e.g. the notification worker) have no clients.
    if (this.principals.size === 0) return;

    this.deliver(payload, scope).catch((error) =>
      Logger.error('WebSocket broadcast failed', {
        type: payload.type,
        error: (error as Error).message,
      }),
    );
  }

  private async deliver(
    payload: Record<string, unknown>,
    scope: INotificationSocketScope,
  ): Promise<void> {
    const audience = await resolveSocketAudience(scope, this.audienceDeps);
    const message = JSON.stringify(payload);
    let recipients = 0;

    this.principals.forEach((principal, client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        isSocketRecipient(principal, audience)
      ) {
        client.send(message);
        recipients += 1;
      }
    });

    Logger.info('WebSocket event broadcasted', {
      type: payload.type,
      recipients,
      connectedClients: this.principals.size,
    });
  }
}
