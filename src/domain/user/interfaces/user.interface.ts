export interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role?: EUserRole;
  active?: boolean;
  devices?: Array<{
    token: string;
    platform: string;
    model?: string;
    lastSeen?: Date;
    enabled?: boolean;
    lastUsed: Date;
    createdAt: Date;
    updatedAt?: Date;
  }>;
  createdAt: Date;
}

export enum EUserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}
