export interface IPushTicket {
  token: string;
  status: 'ok' | 'error';
  id?: string;
  details?: Record<string, unknown>;
  message?: string;
}

export type IPushReceipt = IPushTicket;

export interface INotificationProvider {
  send(payload: {
    to: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<IPushTicket>;
  sendMany(
    payloads: Array<{
      to: string;
      title: string;
      body: string;
      data?: Record<string, unknown>;
    }>,
  ): Promise<IPushTicket[]>;
  getReceipts(ticketIds: string[]): Promise<IPushReceipt[]>;
}
