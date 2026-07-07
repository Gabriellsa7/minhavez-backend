import { AuthService } from '../../../../domain/auth/service/auth.service';
import { HealthProfessionalRepository } from '../../../repository/health-professional/health-professional.repository';
import { UserRepository } from '../../../repository/user/user.repository';

export class AuthServiceFactory {
  static create() {
    const userRepository = new UserRepository();
    const healthProfessionalRepository = new HealthProfessionalRepository();
    return new AuthService(userRepository, healthProfessionalRepository);
  }
}
