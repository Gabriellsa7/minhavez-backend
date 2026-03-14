import { IAuthToken, ILoginRequest } from './auth.interface';

export interface IAuthService {
  login(params: ILoginRequest): Promise<IAuthToken>;
  getUserFromToken(token: string): Promise<string | null>;
}
