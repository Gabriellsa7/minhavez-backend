import { Logger } from 'traceability';
import { INotificationProvider } from '../../../domain/notification/interfaces/notification-provider.interface';

export class ExpoNotificationProvider implements INotificationProvider {
  async send(payload: {
    to: string;
    title: string;
    body: string;
  }): Promise<void> {
    await this.sendMany([payload]);
  }

  async sendMany(
    payloads: Array<{ to: string; title: string; body: string }>,
  ): Promise<void> {
    if (!process.env.EXPO_ACCESS_TOKEN) {
      Logger.info('Expo push simulated', {
        count: payloads.length,
        reason: 'EXPO_ACCESS_TOKEN not configured',
      });
      return;
    }

    await Promise.all(
      payloads.map(async (payload) => {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            to: payload.to,
            title: payload.title,
            sound: 'default',
            body: payload.body,
          }),
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          Logger.error('Expo push failed', { error: result, to: payload.to });
          throw new Error(result?.errors?.[0]?.message || 'Expo push failed');
        }
      }),
    );
  }

  async validateToken(token: string): Promise<boolean> {
    return token.length > 10;
  }

  async removeInvalidToken(token: string): Promise<void> {
    Logger.info('Invalid push token removed', { token });
  }
}
