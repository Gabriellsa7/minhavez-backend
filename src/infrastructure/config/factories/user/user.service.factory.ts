import { UserService } from '../../../domain/user/service/user.service';
import { UserRepository } from '../../repository/user/user.repository';

export class UserServiceFactory {
  static create() {
    const repoRead = new UserRepository();

    return new UserService({
      userRepository: repoRead,
    });
  }
}
