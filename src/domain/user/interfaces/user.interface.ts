export interface IUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface ICreateUser {
  name: string;
  email: string;
}
