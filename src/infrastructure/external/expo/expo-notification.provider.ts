import { Logger } from 'traceability';
import {
  INotificationProvider,
  IPushReceipt,
  IPushTicket,
} from '../../../domain/notification/interfaces/notification-provider.interface';

const EXPO_REQUEST_TIMEOUT_MS = 10_000;

export class ExpoNotificationProvider implements INotificationProvider {
  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      EXPO_REQUEST_TIMEOUT_MS,
    );
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error(
          `Expo request to ${url} timed out after ${EXPO_REQUEST_TIMEOUT_MS}ms`,
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async send(payload: {
    to: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<IPushTicket> {
    return (await this.sendMany([payload]))[0];
  }

  async sendMany(
    payloads: Array<{
      to: string;
      title: string;
      body: string;
      data?: Record<string, unknown>;
    }>,
  ): Promise<IPushTicket[]> {
    Logger.info('Expo push request', { payloads });
    const response = await this.fetchWithTimeout(
      'https://exp.host/--/api/v2/push/send',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.EXPO_ACCESS_TOKEN
            ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
            : {}),
        },
        body: JSON.stringify(
          payloads.map((payload) => ({
            to: payload.to,
            title: payload.title,
            body: payload.body,
            sound: 'default',
            priority: 'high',
            channelId: 'queue-updates',
            data: payload.data ?? {},
          })),
        ),
      },
    );
    const result = (await response.json().catch(() => ({}))) as {
      data?: Array<Omit<IPushTicket, 'token'>>;
      errors?: Array<{ message?: string }>;
    };
    Logger.info('Expo push response', {
      httpStatus: response.status,
      response: result,
    });
    if (!response.ok) {
      throw new Error(result.errors?.[0]?.message || 'Expo push request failed');
    }

    const tickets = payloads.map((payload, index) => ({
      token: payload.to,
      ...(result.data?.[index] ?? {
        status: 'error' as const,
        message: 'Expo did not return a ticket for this payload',
      }),
    }));
    const rejected = tickets.filter((ticket) => ticket.status !== 'ok');
    if (rejected.length > 0) {
      Logger.warn('Expo rejected some push tickets', { rejected });
    }
    // Partial failures (e.g. a single stale token) must not block delivery to
    // the patient's other registered devices; the caller inspects per-ticket
    // status to decide what succeeded and what needs cleanup.
    return tickets;
  }

  async getReceipts(ticketIds: string[]): Promise<IPushReceipt[]> {
    if (ticketIds.length === 0) return [];
    const response = await this.fetchWithTimeout(
      'https://exp.host/--/api/v2/push/getReceipts',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.EXPO_ACCESS_TOKEN
            ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
            : {}),
        },
        body: JSON.stringify({ ids: ticketIds }),
      },
    );
    const result = (await response.json().catch(() => ({}))) as {
      data?: Record<string, Omit<IPushReceipt, 'id' | 'token'>>;
      errors?: Array<{ message?: string }>;
    };
    Logger.info('Expo push receipts response', {
      httpStatus: response.status,
      ticketIds,
      response: result,
    });
    if (!response.ok) {
      throw new Error(result.errors?.[0]?.message || 'Expo receipts request failed');
    }
    return ticketIds.map((id) => ({
      id,
      token: '',
      ...(result.data?.[id] ?? {
        status: 'error' as const,
        message: 'Expo receipt is not available yet',
      }),
    }));
  }

  async validateToken(token: string): Promise<boolean> {
    return token.length > 10;
  }

  async removeInvalidToken(token: string): Promise<void> {
    Logger.info('Invalid push token removed', { token });
  }
}
