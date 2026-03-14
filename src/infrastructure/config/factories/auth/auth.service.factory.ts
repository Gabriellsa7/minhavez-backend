import { AuthService } from '../../../../domain/auth/service/auth.service';
import { UserRepository } from '../../../repository/user/user.repository';

export class AuthServiceFactory {
  static create() {
    const userRepository = new UserRepository();
    return new AuthService(userRepository);
  }
}
