export interface IHealthUnit {
  _id: string;
  userId?: string;
  name: string;
  address: IHealthUnitAddress;
  phone: string;
  description?: string;
  services: IService[];
  openingHours: IHealthUnitOpeningHours;
  email: string;
  img?: string;
  createdAt?: Date;
  updateAt?: Date;
}

export interface IService {
  _id: string;
  name: string;
  description?: string;
  duration?: number;
  price?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IHealthUnitAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface IHealthUnitOpeningHours {
  days: IDailyOpeningHours[];
}

export interface IDailyOpeningHours {
  day: WeekDay;
  open: string;
  close: string;
  isClosed: boolean;
}

export enum WeekDay {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}
