export interface IPasswordResetRepository {
  saveOtp(email: string, code: string, ttlSeconds: number): Promise<void>;
  getOtp(email: string): Promise<string | null>;
  deleteOtp(email: string): Promise<void>;
  incrementAttempts(email: string, ttlSeconds: number): Promise<number>;
  resetAttempts(email: string): Promise<void>;
  isInCooldown(email: string): Promise<boolean>;
  setCooldown(email: string, ttlSeconds: number): Promise<void>;
  saveResetToken(
    resetToken: string,
    email: string,
    ttlSeconds: number,
  ): Promise<void>;
  getEmailByResetToken(resetToken: string): Promise<string | null>;
  deleteResetToken(resetToken: string): Promise<void>;
}
