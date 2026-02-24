export interface IUser {
  id: string;
  name: string;
  email: string;
  role?: 'ADMIN' | 'USER' | 'PROFISSIONAL';
  active?: boolean;
  createdAt: Date;
}

export interface ICreateUser {
  name: string;
  email: string;
  password: string;
}
