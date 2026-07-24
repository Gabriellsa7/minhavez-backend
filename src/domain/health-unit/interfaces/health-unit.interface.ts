export interface IHealthUnit {
  _id: string;
  userId?: string;
  name: string;
  address: IHealthUnitAddress;
  phone: string;
  description?: string;
  services: IService[];
  email: string;
  img?: string;
  createdAt?: Date;
  updateAt?: Date;
}

export interface IService {
  _id: string;
  name: string;
  description?: string;
  duration?: number; //minutes
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
