import { AuthService } from '../../domain/auth/service/auth.service';
import { IUserRepository } from '../../domain/user/repository/user.repository.interface';
import { IHealthProfessionalRepository } from '../../domain/health-professional.ts/repository/health-professional.repository.interface';
import { IPasswordResetRepository } from '../../domain/auth/repository/password-reset.repository.interface';
import { IEmailProvider } from '../../domain/auth/interfaces/email-provider.interface';
import { AppError } from '../../shared/errors/AppError';

describe('AuthService - password reset', () => {
  const email = 'patient@example.com';

  function buildService(overrides?: {
    userRepository?: Partial<IUserRepository>;
    passwordResetRepository?: Partial<IPasswordResetRepository>;
    emailProvider?: Partial<IEmailProvider>;
  }) {
    const userRepository = {
      findUserByEmail: jest.fn().mockResolvedValue({ _id: 'user-1', email }),
      updatePassword: jest.fn().mockResolvedValue(undefined),
      ...overrides?.userRepository,
    } as unknown as IUserRepository;

    const healthProfessionalRepository = {} as IHealthProfessionalRepository;

    const passwordResetRepository = {
      isInCooldown: jest.fn().mockResolvedValue(false),
      setCooldown: jest.fn().mockResolvedValue(undefined),
      saveOtp: jest.fn().mockResolvedValue(undefined),
      getOtp: jest.fn().mockResolvedValue(null),
      deleteOtp: jest.fn().mockResolvedValue(undefined),
      incrementAttempts: jest.fn().mockResolvedValue(1),
      resetAttempts: jest.fn().mockResolvedValue(undefined),
      saveResetToken: jest.fn().mockResolvedValue(undefined),
      getEmailByResetToken: jest.fn().mockResolvedValue(null),
      deleteResetToken: jest.fn().mockResolvedValue(undefined),
      ...overrides?.passwordResetRepository,
    } as unknown as IPasswordResetRepository;

    const emailProvider = {
      sendMail: jest.fn().mockResolvedValue(undefined),
      ...overrides?.emailProvider,
    } as unknown as IEmailProvider;

    const service = new AuthService(
      userRepository,
      healthProfessionalRepository,
      passwordResetRepository,
      emailProvider,
    );

    return { service, userRepository, passwordResetRepository, emailProvider };
  }

  describe('requestPasswordReset', () => {
    it('generates and emails a code for an existing account', async () => {
      const { service, passwordResetRepository, emailProvider } =
        buildService();

      await service.requestPasswordReset({ email });

      expect(passwordResetRepository.saveOtp).toHaveBeenCalledWith(
        email,
        expect.stringMatching(/^\d{6}$/),
        600,
      );
      expect(emailProvider.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: email }),
      );
    });

    it('does nothing when the account does not exist', async () => {
      const { service, passwordResetRepository, emailProvider } =
        buildService({
          userRepository: { findUserByEmail: jest.fn().mockResolvedValue(null) },
        });

      await service.requestPasswordReset({ email });

      expect(passwordResetRepository.saveOtp).not.toHaveBeenCalled();
      expect(emailProvider.sendMail).not.toHaveBeenCalled();
    });

    it('does nothing while in cooldown', async () => {
      const { service, passwordResetRepository, emailProvider } =
        buildService({
          passwordResetRepository: {
            isInCooldown: jest.fn().mockResolvedValue(true),
          },
        });

      await service.requestPasswordReset({ email });

      expect(passwordResetRepository.saveOtp).not.toHaveBeenCalled();
      expect(emailProvider.sendMail).not.toHaveBeenCalled();
    });

    it('throws AppError(500) when sending the email fails', async () => {
      const { service } = buildService({
        emailProvider: {
          sendMail: jest.fn().mockRejectedValue(new Error('smtp down')),
        },
      });

      await expect(service.requestPasswordReset({ email })).rejects.toThrow(
        AppError,
      );
    });
  });

  describe('verifyResetCode', () => {
    it('returns a reset token when the code matches', async () => {
      const { service, passwordResetRepository } = buildService({
        passwordResetRepository: {
          getOtp: jest.fn().mockResolvedValue('123456'),
        },
      });

      const result = await service.verifyResetCode({ email, code: '123456' });

      expect(result.resetToken).toEqual(expect.any(String));
      expect(passwordResetRepository.deleteOtp).toHaveBeenCalledWith(email);
      expect(passwordResetRepository.saveResetToken).toHaveBeenCalledWith(
        result.resetToken,
        email,
        600,
      );
    });

    it('throws AppError(400) when the code does not match', async () => {
      const { service } = buildService({
        passwordResetRepository: {
          getOtp: jest.fn().mockResolvedValue('123456'),
        },
      });

      await expect(
        service.verifyResetCode({ email, code: '000000' }),
      ).rejects.toMatchObject({ status: 400 });
    });

    it('throws AppError(429) after exceeding the attempt limit', async () => {
      const { service, passwordResetRepository } = buildService({
        passwordResetRepository: {
          incrementAttempts: jest.fn().mockResolvedValue(6),
        },
      });

      await expect(
        service.verifyResetCode({ email, code: '123456' }),
      ).rejects.toMatchObject({ status: 429 });
      expect(passwordResetRepository.deleteOtp).toHaveBeenCalledWith(email);
    });
  });

  describe('resetPassword', () => {
    it('hashes and persists the new password, then deletes the token', async () => {
      const { service, userRepository, passwordResetRepository } =
        buildService({
          passwordResetRepository: {
            getEmailByResetToken: jest.fn().mockResolvedValue(email),
          },
        });

      await service.resetPassword({
        resetToken: 'a-token',
        newPassword: 'newpassword123',
      });

      expect(userRepository.updatePassword).toHaveBeenCalledWith(
        'user-1',
        expect.any(String),
      );
      expect(userRepository.updatePassword).not.toHaveBeenCalledWith(
        'user-1',
        'newpassword123',
      );
      expect(passwordResetRepository.deleteResetToken).toHaveBeenCalledWith(
        'a-token',
      );
    });

    it('throws AppError(400) when the reset token is invalid or expired', async () => {
      const { service } = buildService({
        passwordResetRepository: {
          getEmailByResetToken: jest.fn().mockResolvedValue(null),
        },
      });

      await expect(
        service.resetPassword({
          resetToken: 'bad-token',
          newPassword: 'newpassword123',
        }),
      ).rejects.toMatchObject({ status: 400 });
    });
  });
});
