/**
 * Who an event is about. The gateway only delivers it to staff of the
 * resolved health unit, the admin who owns that unit, and the users who
 * own the listed patients. An empty scope reaches nobody.
 */
export interface INotificationSocketScope {
  healthUnitId?: string;
  /** Resolved to its health unit when `healthUnitId` is not given. */
  queueId?: string;
  patientIds?: string[];
}

export interface INotificationSocketGateway {
  broadcastNotification(
    payload: Record<string, unknown>,
    scope: INotificationSocketScope,
  ): void;
}
