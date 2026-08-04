import { PushTokenService } from '../../../../domain/notification/service/push-token.service';
import { UserRepository } from '../../../repository/user/user.repository';

export class PushTokenServiceFactory {
  static create() {
    return new PushTokenService({
      userRepository: new UserRepository(),
    });
  }
}
