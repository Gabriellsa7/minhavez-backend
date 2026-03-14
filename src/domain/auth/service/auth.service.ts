import bcrypt from 'bcrypt';
import { IAuthToken, ILoginRequest } from '../interfaces/auth.interface';
import { IAuthService } from '../interfaces/auth.service.interface';
import { IUserRepository } from '../../user/repository/user.repository.interface';

const TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour

export class AuthService implements IAuthService {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async login(params: ILoginRequest): Promise<IAuthToken> {
    const user = await this.userRepository.findUserByEmailWithPassword(
      params.email,
    );
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(params.password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
    const token = Buffer.from(
      `${user._id}|${expiresAt.toISOString()}`,
    ).toString('base64');

    return {
      token,
      expiresAt,
    };
  }

  async getUserFromToken(token: string): Promise<string | null> {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      const [userId, expiresAtRaw] = decoded.split('|');
      const expiresAt = new Date(expiresAtRaw);
      if (isNaN(expiresAt.getTime()) || expiresAt < new Date()) {
        return null;
      }
      return userId;
    } catch {
      return null;
    }
  }
}
