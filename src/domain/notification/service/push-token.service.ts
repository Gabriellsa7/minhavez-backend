import { IUserRepository } from '../../user/repository/user.repository.interface';
import { Logger } from 'traceability';

export interface IParamsPushTokenService {
  userRepository: IUserRepository;
}

export class PushTokenService {
  private readonly userRepository: IUserRepository;

  constructor(params: IParamsPushTokenService) {
    this.userRepository = params.userRepository;
  }

  async registerToken(
    userId: string,
    token: string,
    platform: string,
  ): Promise<void> {
    if (!/^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/.test(token)) {
      throw new Error('Invalid Expo push token format');
    }
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const existing = user.devices?.find((device) => device.token === token);
    if (existing) {
      existing.lastUsed = new Date();
      existing.lastSeen = new Date();
      existing.enabled = true;
      existing.updatedAt = new Date();
      await this.userRepository.updateUserById(userId, {
        userData: { devices: user.devices },
      });
      Logger.info('Expo push token refreshed', { userId, token, platform });
      return;
    }

    const devices = [
      ...(user.devices ?? []),
      {
        token,
        platform,
        model: 'unknown',
        lastSeen: new Date(),
        enabled: true,
        lastUsed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    await this.userRepository.updateUserById(userId, {
      userData: { devices },
    });
    Logger.info('Expo push token registered', { userId, token, platform });
  }
}
