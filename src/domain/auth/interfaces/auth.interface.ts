import { IHealthProfessional } from "../../health-professional.ts/interfaces/health-professional.interface";
import { IUser } from "../../user/interfaces/user.interface";

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IAuthToken {
  token: string;
  expiresAt: Date;
}

export interface IAuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user?: IUser;
  healthProfessional?: IHealthProfessional | null;
}

export interface IAuthPayload {
  sub: string; // user id
  email: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
  iss?: string;
}

export interface IRefreshTokenRequest {
  refreshToken: string;
}
