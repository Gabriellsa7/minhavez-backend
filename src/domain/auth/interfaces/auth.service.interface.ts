import { IAuthTokenResponse, ILoginRequest, IRefreshTokenRequest } from './auth.interface';

export interface IAuthService {
  login(params: ILoginRequest): Promise<IAuthTokenResponse>;
  refreshToken(params: IRefreshTokenRequest): Promise<IAuthTokenResponse>;
  getUserFromToken(token: string): Promise<string | null>;
  validateToken(token: string): Promise<boolean>;
}
