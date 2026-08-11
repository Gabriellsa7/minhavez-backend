import IORedis from 'ioredis';
import { IPasswordResetRepository } from '../../../domain/auth/repository/password-reset.repository.interface';

const OTP_KEY_PREFIX = 'pwreset:otp:';
const ATTEMPTS_KEY_PREFIX = 'pwreset:attempts:';
const COOLDOWN_KEY_PREFIX = 'pwreset:cooldown:';
const TOKEN_KEY_PREFIX = 'pwreset:token:';

export class PasswordResetRepository implements IPasswordResetRepository {
  constructor(private readonly connection: IORedis) {}

  async saveOtp(email: string, code: string, ttlSeconds: number): Promise<void> {
    await this.connection.set(OTP_KEY_PREFIX + email, code, 'EX', ttlSeconds);
  }

  async getOtp(email: string): Promise<string | null> {
    return this.connection.get(OTP_KEY_PREFIX + email);
  }

  async deleteOtp(email: string): Promise<void> {
    await this.connection.del(OTP_KEY_PREFIX + email);
  }

  async incrementAttempts(email: string, ttlSeconds: number): Promise<number> {
    const key = ATTEMPTS_KEY_PREFIX + email;
    const attempts = await this.connection.incr(key);
    if (attempts === 1) {
      await this.connection.expire(key, ttlSeconds);
    }
    return attempts;
  }

  async resetAttempts(email: string): Promise<void> {
    await this.connection.del(ATTEMPTS_KEY_PREFIX + email);
  }

  async isInCooldown(email: string): Promise<boolean> {
    const value = await this.connection.get(COOLDOWN_KEY_PREFIX + email);
    return value !== null;
  }

  async setCooldown(email: string, ttlSeconds: number): Promise<void> {
    await this.connection.set(COOLDOWN_KEY_PREFIX + email, '1', 'EX', ttlSeconds);
  }

  async saveResetToken(
    resetToken: string,
    email: string,
    ttlSeconds: number,
  ): Promise<void> {
    await this.connection.set(
      TOKEN_KEY_PREFIX + resetToken,
      email,
      'EX',
      ttlSeconds,
    );
  }

  async getEmailByResetToken(resetToken: string): Promise<string | null> {
    return this.connection.get(TOKEN_KEY_PREFIX + resetToken);
  }

  async deleteResetToken(resetToken: string): Promise<void> {
    await this.connection.del(TOKEN_KEY_PREFIX + resetToken);
  }
}
