import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  IAuthTokenResponse,
  IAuthPayload,
  ILoginRequest,
  IRefreshTokenRequest,
} from '../interfaces/auth.interface';
import { IAuthService } from '../interfaces/auth.service.interface';
import { IUserRepository } from '../../user/repository/user.repository.interface';

export class AuthService implements IAuthService {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async login(params: ILoginRequest): Promise<IAuthTokenResponse> {
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

    const payload: IAuthPayload = {
      sub: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role || 'USER',
    };

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
    if (!refreshSecret) {
      throw new Error('REFRESH_TOKEN_SECRET not configured');
    }

    const accessToken = jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRATION || '1h',
      issuer: 'minhavez-api',
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, refreshSecret, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
      issuer: 'minhavez-api',
    } as jwt.SignOptions);

    return {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRATION || '1h',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt,
      },
    };
  }

  async refreshToken(
    params: IRefreshTokenRequest,
  ): Promise<IAuthTokenResponse> {
    try {
      const decoded = jwt.verify(
        params.refreshToken,
        process.env.REFRESH_TOKEN_SECRET!,
      ) as IAuthPayload;

      // Verificar se o usuário ainda existe
      const user = await this.userRepository.findById(decoded.sub);
      if (!user) {
        throw new Error('User not found');
      }

      const payload: IAuthPayload = {
        sub: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role || 'USER',
      };

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET not configured');
      }

      const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
      if (!refreshSecret) {
        throw new Error('REFRESH_TOKEN_SECRET not configured');
      }

      const accessToken = jwt.sign(payload, secret, {
        expiresIn: process.env.JWT_EXPIRATION || '1h',
        issuer: 'minhavez-api',
      } as jwt.SignOptions);

      const refreshToken = jwt.sign(payload, refreshSecret, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
        issuer: 'minhavez-api',
      } as jwt.SignOptions);

      return {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRATION || '1h',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
          createdAt: user.createdAt,
        },
      };
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  async getUserFromToken(token: string): Promise<string | null> {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET not configured');
      }
      const decoded = jwt.verify(token, secret) as IAuthPayload;
      return decoded.sub;
    } catch {
      return null;
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return false;
      }
      jwt.verify(token, secret);
      return true;
    } catch {
      return false;
    }
  }
}
