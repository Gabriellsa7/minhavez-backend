import { AuthService } from '../../../../domain/auth/service/auth.service';
import { HealthProfessionalRepository } from '../../../repository/health-professional/health-professional.repository';
import { UserRepository } from '../../../repository/user/user.repository';
import { PasswordResetRepository } from '../../../repository/auth/password-reset.repository';
import { NodemailerEmailProvider } from '../../../external/nodemailer/nodemailer-email.provider';
import { BullMqProvider } from '../../../queue/bullmq/bullmq.provider';

export class AuthServiceFactory {
  static create() {
    const userRepository = new UserRepository();
    const healthProfessionalRepository = new HealthProfessionalRepository();
    const passwordResetRepository = new PasswordResetRepository(
      BullMqProvider.getConnection(),
    );
    const emailProvider = new NodemailerEmailProvider();
    return new AuthService(
      userRepository,
      healthProfessionalRepository,
      passwordResetRepository,
      emailProvider,
    );
  }
}
