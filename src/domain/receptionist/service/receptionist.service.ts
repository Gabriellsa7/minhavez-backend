import bcrypt from 'bcrypt';
import { IReceptionist } from '../interfaces/receptionist.interface';
import {
  IParamsReceptionistService,
  IReceptionistService,
} from '../interfaces/receptionist.service.interface';
import {
  IParamsCreateReceptionist,
  IParamsUpdateReceptionist,
  IReceptionistRepository,
} from '../repository/receptionist.repository.interface';
import { AppError } from '../../../shared/errors/AppError';

export class ReceptionistService implements IReceptionistService {
  private receptionistRepository: IReceptionistRepository;

  constructor(params: IParamsReceptionistService) {
    this.receptionistRepository = params.receptionistRepository;
  }

  /** Strips the password hash before a receptionist is returned to a
   * client — same precedent as patients stripping Cloudinary storage
   * details before responses reach clients. */
  private sanitize(receptionist: IReceptionist): IReceptionist {
    const { password: _password, ...rest } = receptionist;
    return { ...rest, password: '' };
  }

  async createReceptionist(
    params: IParamsCreateReceptionist,
  ): Promise<IReceptionist> {
    try {
      const hashedPassword = await bcrypt.hash(params.password, 10);

      const receptionist = await this.receptionistRepository.createReceptionist({
        ...params,
        password: hashedPassword,
      });

      return this.sanitize(receptionist);
    } catch (error) {
      throw new Error(
        `Error creating receptionist: ${(error as Error).message}`,
      );
    }
  }

  async getReceptionistById(_id: string): Promise<IReceptionist | null> {
    try {
      const receptionist =
        await this.receptionistRepository.getReceptionistById(_id);

      if (!receptionist) {
        throw new AppError(404, 'Receptionist not found');
      }

      return this.sanitize(receptionist);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new Error(
        `Error retrieving receptionist by ID: ${(error as Error).message}`,
      );
    }
  }

  async listReceptionistsByHealthUnitId(
    healthUnitId: string,
  ): Promise<IReceptionist[]> {
    try {
      const receptionists =
        await this.receptionistRepository.listReceptionistsByHealthUnitId(
          healthUnitId,
        );

      return receptionists.map((receptionist) => this.sanitize(receptionist));
    } catch (error) {
      throw new Error(
        `Error listing receptionists: ${(error as Error).message}`,
      );
    }
  }

  async updateReceptionistById(
    _id: string,
    params: IParamsUpdateReceptionist,
  ): Promise<IReceptionist | null> {
    try {
      const receptionist =
        await this.receptionistRepository.getReceptionistById(_id);

      if (!receptionist) {
        throw new AppError(404, 'Receptionist not found');
      }

      const updated = await this.receptionistRepository.updateReceptionistById(
        _id,
        params,
      );

      return updated ? this.sanitize(updated) : null;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new Error(
        `Error updating receptionist: ${(error as Error).message}`,
      );
    }
  }

  async deleteReceptionistById(_id: string): Promise<IReceptionist | null> {
    try {
      const receptionist =
        await this.receptionistRepository.getReceptionistById(_id);

      if (!receptionist) {
        throw new AppError(404, 'Receptionist not found');
      }

      const deleted =
        await this.receptionistRepository.deleteReceptionistById(_id);

      return deleted ? this.sanitize(deleted) : null;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new Error(
        `Error deleting receptionist: ${(error as Error).message}`,
      );
    }
  }
}
