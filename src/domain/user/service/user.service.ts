import { IUser } from '../interfaces/user.interface';
import {
  IParamsUserService,
  IUserImageUploadParams,
  IUserService,
} from '../interfaces/user.service.interface';
import bcrypt from 'bcrypt';
import {
  IParamsCreateUser,
  IParamsUpdateUser,
  IUserRepository,
} from '../repository/user.repository.interface';
import { uploadImageToCloudinary } from '../../../infrastructure/external/cloudinary/cloudinary-upload';

export class UserService implements IUserService {
  private userRepository: IUserRepository;

  constructor(params: IParamsUserService) {
    this.userRepository = params.userRepository;
  }

  async createUser(params: IParamsCreateUser): Promise<IUser> {
    const existingUser = await this.userRepository.findUserByEmail(
      params.email,
    );
    if (existingUser) {
      throw new Error('Já existe uma conta com este e-mail.');
    }

    const hashedPassword = await bcrypt.hash(params.password, 10);

    return await this.userRepository.createUser({
      ...params,
      password: hashedPassword,
    });
  }

  async getUserById(_id: string): Promise<IUser | null> {
    try {
      const user = await this.userRepository.findUserById(_id);
      if (!user) {
        throw new Error('Usuário não encontrado.');
      }
      return user;
    } catch (error) {
      throw new Error(
        `Error retrieving user by ID: ${(error as Error).message}`,
      );
    }
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    try {
      const user = await this.userRepository.findUserByEmail(email);
      if (!user) {
        throw new Error('Usuário não encontrado.');
      }
      return user;
    } catch (error) {
      throw new Error(
        `Error retrieving user by email: ${(error as Error).message}`,
      );
    }
  }

  async updateUserById(
    _id: string,
    params: IParamsUpdateUser,
  ): Promise<IUser | null> {
    const user = await this.userRepository.findUserById(_id);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    return await this.userRepository.updateUserById(_id, params);
  }

  async uploadUserImage(
    _id: string,
    params: IUserImageUploadParams,
  ): Promise<IUser | null> {
    try {
      const existingUser = await this.userRepository.findUserById(_id);

      if (!existingUser) {
        throw new Error('Usuário não encontrado.');
      }

      const uploadedImage = await uploadImageToCloudinary({
        imageBase64: params.imageBase64,
        fileName: params.fileName,
        mimeType: params.mimeType,
      });

      return await this.userRepository.updateUserById(_id, {
        avatar: uploadedImage.secureUrl,
      });
    } catch (error) {
      throw new Error(
        `Error uploading user image: ${(error as Error).message}`,
      );
    }
  }

  async deleteUserById(_id: string): Promise<IUser | null> {
    const user = await this.userRepository.findUserById(_id);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    await this.userRepository.deleteUserById(_id);
    return user;
  }

  async listUsers(filter: Partial<IUser> = {}): Promise<IUser[]> {
    return await this.userRepository.listUsers(filter);
  }
}
