export interface IHealthUnit {
  _id: string;
  name: string;
  address: IHealthUnitAddress;
  phone: string;
  email: string;
  createdAt: Date;
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
