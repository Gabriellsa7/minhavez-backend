import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  IAuthTokenResponse,
  IAuthPayload,
  ILoginRequest,
  IRefreshTokenRequest,
  EPrincipalType,
} from '../interfaces/auth.interface';
import { IAuthService } from '../interfaces/auth.service.interface';
import { IUserRepository } from '../../user/repository/user.repository.interface';
import { IHealthProfessionalRepository } from '../../health-professional.ts/repository/health-professional.repository.interface';
import { EUserRole } from '../../user/interfaces/user.interface';

export class AuthService implements IAuthService {
  private userRepository: IUserRepository;
  private healthProfessionalRepository: IHealthProfessionalRepository;

  constructor(
    userRepository: IUserRepository,
    healthProfessionalRepository: IHealthProfessionalRepository,
  ) {
    this.userRepository = userRepository;
    this.healthProfessionalRepository = healthProfessionalRepository;
  }

  private generateTokens(payload: IAuthPayload) {
    const secret = process.env.JWT_SECRET;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    if (!refreshSecret) {
      throw new Error('REFRESH_TOKEN_SECRET not configured');
    }

    return {
      accessToken: jwt.sign(payload, secret, {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        issuer: 'minhavez-api',
      } as jwt.SignOptions),

      refreshToken: jwt.sign(payload, refreshSecret, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
        issuer: 'minhavez-api',
      } as jwt.SignOptions),

      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    };
  }
  async login(data: ILoginRequest): Promise<IAuthTokenResponse> {
    const { email, password } = data;

    const user = await this.userRepository.findUserByEmailWithPassword(email);

    if (user) {
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        throw new Error('Invalid credentials');
      }

      const payload: IAuthPayload = {
        sub: user._id.toString(),
        email: user.email,
        name: user.name,
        principalType: EPrincipalType.USER,
        role: user.role ?? EUserRole.USER,
      };

      const { accessToken, refreshToken, expiresIn } =
        this.generateTokens(payload);

      return {
        accessToken,
        refreshToken,
        expiresIn,

        principalType: EPrincipalType.USER,

        principal: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role ?? EUserRole.USER,
        },
      };
    }

    const professional =
      await this.healthProfessionalRepository.findHealthProfessionalByEmailWithPassword(
        email,
      );

    if (professional) {
      const validPassword = await bcrypt.compare(
        password,
        professional.password,
      );

      if (!validPassword) {
        throw new Error('Invalid credentials');
      }

      const payload: IAuthPayload = {
        sub: professional._id.toString(),
        email: professional.email,
        name: professional.name,
        principalType: EPrincipalType.HEALTH_PROFESSIONAL,
      };

      const { accessToken, refreshToken, expiresIn } =
        this.generateTokens(payload);

      return {
        accessToken,
        refreshToken,
        expiresIn,

        principalType: EPrincipalType.HEALTH_PROFESSIONAL,

        principal: {
          id: professional._id.toString(),
          name: professional.name,
          email: professional.email,
        },
      };
    }

    throw new Error('Invalid credentials');
  }

  async refreshToken(
    params: IRefreshTokenRequest,
  ): Promise<IAuthTokenResponse> {
    try {
      const decoded = jwt.verify(
        params.refreshToken,
        process.env.REFRESH_TOKEN_SECRET!,
      ) as IAuthPayload;

      let payload: IAuthPayload;

      let principal: {
        _id: string;
        name: string;
        email: string;
        role?: EUserRole;
      };

      if (decoded.principalType === EPrincipalType.HEALTH_PROFESSIONAL) {
        const professional =
          await this.healthProfessionalRepository.getHealthProfessionalById(
            decoded.sub,
          );

        if (!professional) {
          throw new Error('Health professional not found');
        }

        principal = professional;

        payload = {
          sub: professional._id.toString(),
          name: professional.name,
          email: professional.email,

          principalType: EPrincipalType.HEALTH_PROFESSIONAL,
        };
      } else {
        const user = await this.userRepository.findById(decoded.sub);

        if (!user) {
          throw new Error('User not found');
        }

        principal = user;

        payload = {
          sub: user._id.toString(),
          name: user.name,
          email: user.email,

          principalType: EPrincipalType.USER,

          role: user.role ?? EUserRole.USER,
        };
      }

      const { accessToken, refreshToken, expiresIn } =
        this.generateTokens(payload);

      return {
        accessToken,
        refreshToken,
        expiresIn,

        principalType: payload.principalType,

        principal: {
          id: principal._id.toString(),
          name: principal.name,
          email: principal.email,
          role: payload.role,
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
