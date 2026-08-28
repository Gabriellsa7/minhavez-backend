import {
  IParamsCreateReceptionist,
  IParamsUpdateReceptionist,
  IReceptionistRepository,
} from '../repository/receptionist.repository.interface';
import { IReceptionist } from './receptionist.interface';

export interface IParamsReceptionistService {
  receptionistRepository: IReceptionistRepository;
}

export interface IReceptionistService {
  createReceptionist(
    params: IParamsCreateReceptionist,
  ): Promise<IReceptionist>;
  getReceptionistById(_id: string): Promise<IReceptionist | null>;
  listReceptionistsByHealthUnitId(
    healthUnitId: string,
  ): Promise<IReceptionist[]>;
  updateReceptionistById(
    _id: string,
    params: IParamsUpdateReceptionist,
  ): Promise<IReceptionist | null>;
  deleteReceptionistById(_id: string): Promise<IReceptionist | null>;
}
