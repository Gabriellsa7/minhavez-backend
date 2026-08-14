import { EUserRole } from '../../user/interfaces/user.interface';
import { EHealthProfessionalType } from '../../health-professional.ts/interfaces/health-professional.interface';

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IAuthToken {
  token: string;
  expiresAt: Date;
}

export enum EPrincipalType {
  USER = 'USER',
  HEALTH_PROFESSIONAL = 'HEALTH_PROFESSIONAL',
}

export interface IAuthPrincipal {
  id: string;
  name: string;
  email: string;
  role?: EUserRole;
  healthProfessionalType?: EHealthProfessionalType;
  healthUnitId?: string;
}

export interface IAuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  principalType: EPrincipalType;
  principal: IAuthPrincipal;
}

export interface IAuthPayload {
  sub: string;
  email: string;
  name: string;

  principalType: EPrincipalType;

  role?: EUserRole;

  healthProfessionalType?: EHealthProfessionalType;
  healthUnitId?: string;

  iat?: number;
  exp?: number;
  iss?: string;
}

export interface IRefreshTokenRequest {
  refreshToken: string;
}

export interface IForgotPasswordRequest {
  email: string;
}

export interface IVerifyResetCodeRequest {
  email: string;
  code: string;
}

export interface IVerifyResetCodeResponse {
  resetToken: string;
}

export interface IResetPasswordRequest {
  resetToken: string;
  newPassword: string;
}
