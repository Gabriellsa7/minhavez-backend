import {
  IAuthTokenResponse,
  ILoginRequest,
  IRefreshTokenRequest,
  IForgotPasswordRequest,
  IVerifyResetCodeRequest,
  IVerifyResetCodeResponse,
  IResetPasswordRequest,
} from './auth.interface';

export interface IAuthService {
  login(params: ILoginRequest): Promise<IAuthTokenResponse>;
  refreshToken(params: IRefreshTokenRequest): Promise<IAuthTokenResponse>;
  getUserFromToken(token: string): Promise<string | null>;
  validateToken(token: string): Promise<boolean>;
  requestPasswordReset(params: IForgotPasswordRequest): Promise<void>;
  verifyResetCode(
    params: IVerifyResetCodeRequest,
  ): Promise<IVerifyResetCodeResponse>;
  resetPassword(params: IResetPasswordRequest): Promise<void>;
}
