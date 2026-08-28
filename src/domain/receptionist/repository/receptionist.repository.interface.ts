import { IReceptionist } from '../interfaces/receptionist.interface';

export interface IParamsCreateReceptionist {
  healthUnitId: string;
  name: string;
  email: string;
  password: string;
}

export type IParamsUpdateReceptionist = Partial<IReceptionist>;

export interface IReceptionistRepository {
  createReceptionist(
    receptionistData: IParamsCreateReceptionist,
  ): Promise<IReceptionist>;
  updateReceptionistById(
    id: string,
    params: IParamsUpdateReceptionist,
  ): Promise<IReceptionist | null>;
  deleteReceptionistById(id: string): Promise<IReceptionist | null>;
  getReceptionistById(id: string): Promise<IReceptionist | null>;
  listReceptionistsByHealthUnitId(
    healthUnitId: string,
  ): Promise<IReceptionist[]>;
  findReceptionistByEmailWithPassword(
    email: string,
  ): Promise<(IReceptionist & { password: string }) | null>;
}
