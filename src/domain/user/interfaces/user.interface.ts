export interface IUser {
  _id: string;
  name: string;
  email: string;
  role?: EUserRole;
  active?: boolean;
  createdAt: Date;
}

export enum EUserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}
