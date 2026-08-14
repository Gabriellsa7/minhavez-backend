import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {
  IAuthTokenResponse,
  IAuthPayload,
  ILoginRequest,
  IRefreshTokenRequest,
  IForgotPasswordRequest,
  IVerifyResetCodeRequest,
  IVerifyResetCodeResponse,
  IResetPasswordRequest,
  EPrincipalType,
} from '../interfaces/auth.interface';
import { IAuthService } from '../interfaces/auth.service.interface';
import { IUserRepository } from '../../user/repository/user.repository.interface';
import { IHealthProfessionalRepository } from '../../health-professional.ts/repository/health-professional.repository.interface';
import { IPasswordResetRepository } from '../repository/password-reset.repository.interface';
import { IEmailProvider } from '../interfaces/email-provider.interface';
import { EUserRole } from '../../user/interfaces/user.interface';
import { AppError } from '../../../shared/errors/AppError';
import { buildPasswordResetEmail } from '../../../shared/utils/passwordResetEmailTemplate';

const OTP_TTL_SECONDS = 10 * 60;
const RESET_TOKEN_TTL_SECONDS = 10 * 60;
const COOLDOWN_TTL_SECONDS = 60;
const MAX_VERIFY_ATTEMPTS = 5;

export class AuthService implements IAuthService {
  private userRepository: IUserRepository;
  private healthProfessionalRepository: IHealthProfessionalRepository;
  private passwordResetRepository: IPasswordResetRepository;
  private emailProvider: IEmailProvider;

  constructor(
    userRepository: IUserRepository,
    healthProfessionalRepository: IHealthProfessionalRepository,
    passwordResetRepository: IPasswordResetRepository,
    emailProvider: IEmailProvider,
  ) {
    this.userRepository = userRepository;
    this.healthProfessionalRepository = healthProfessionalRepository;
    this.passwordResetRepository = passwordResetRepository;
    this.emailProvider = emailProvider;
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
        healthProfessionalType: professional.type,
        healthUnitId: professional.healthUnitId,
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
          healthProfessionalType: professional.type,
          healthUnitId: professional.healthUnitId,
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

          healthProfessionalType: professional.type,
          healthUnitId: professional.healthUnitId,
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
          healthProfessionalType: payload.healthProfessionalType,
          healthUnitId: payload.healthUnitId,
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

  async requestPasswordReset(data: IForgotPasswordRequest): Promise<void> {
    const { email } = data;

    const user = await this.userRepository.findUserByEmail(email);
    if (!user) {
      return;
    }

    if (await this.passwordResetRepository.isInCooldown(email)) {
      return;
    }

    const code = crypto.randomInt(100000, 1000000).toString();

    await this.passwordResetRepository.saveOtp(email, code, OTP_TTL_SECONDS);
    await this.passwordResetRepository.resetAttempts(email);
    await this.passwordResetRepository.setCooldown(
      email,
      COOLDOWN_TTL_SECONDS,
    );

    try {
      const { subject, html, text } = buildPasswordResetEmail(code);
      await this.emailProvider.sendMail({ to: email, subject, html, text });
    } catch {
      throw new AppError(
        500,
        'Não foi possível enviar o e-mail. Tente novamente mais tarde.',
      );
    }
  }

  async verifyResetCode(
    data: IVerifyResetCodeRequest,
  ): Promise<IVerifyResetCodeResponse> {
    const { email, code } = data;

    const attempts = await this.passwordResetRepository.incrementAttempts(
      email,
      OTP_TTL_SECONDS,
    );

    if (attempts > MAX_VERIFY_ATTEMPTS) {
      await this.passwordResetRepository.deleteOtp(email);
      throw new AppError(429, 'Muitas tentativas. Solicite um novo código.');
    }

    const storedCode = await this.passwordResetRepository.getOtp(email);

    if (!storedCode || storedCode !== code) {
      throw new AppError(400, 'Código inválido ou expirado.');
    }

    await this.passwordResetRepository.deleteOtp(email);
    await this.passwordResetRepository.resetAttempts(email);

    const resetToken = crypto.randomBytes(32).toString('hex');
    await this.passwordResetRepository.saveResetToken(
      resetToken,
      email,
      RESET_TOKEN_TTL_SECONDS,
    );

    return { resetToken };
  }

  async resetPassword(data: IResetPasswordRequest): Promise<void> {
    const { resetToken, newPassword } = data;

    const email =
      await this.passwordResetRepository.getEmailByResetToken(resetToken);

    if (!email) {
      throw new AppError(400, 'Token inválido ou expirado.');
    }

    const user = await this.userRepository.findUserByEmail(email);

    if (!user) {
      throw new AppError(400, 'Usuário não encontrado.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.updatePassword(user._id, hashedPassword);
    await this.passwordResetRepository.deleteResetToken(resetToken);
  }
}
