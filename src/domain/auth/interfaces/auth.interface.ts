export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IAuthToken {
  token: string;
  expiresAt: Date;
}
