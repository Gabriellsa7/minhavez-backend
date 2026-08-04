export interface INotificationProvider {
  send(payload: { to: string; title: string; body: string }): Promise<void>;
  sendMany(
    payloads: Array<{ to: string; title: string; body: string }>,
  ): Promise<void>;
}
