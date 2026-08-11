import { Request, Response, Router } from 'express';
import { IController } from './IController';
import { IAuthService } from '../../../domain/auth/interfaces/auth.service.interface';
import {
  ILoginRequest,
  IRefreshTokenRequest,
  IForgotPasswordRequest,
  IVerifyResetCodeRequest,
  IResetPasswordRequest,
} from '../../../domain/auth/interfaces/auth.interface';
import { AppError } from '../../../shared/errors/AppError';

export class AuthController implements IController {
  router: Router;
  private readonly authService: IAuthService;

  constructor(authService: IAuthService) {
    this.authService = authService;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.post('/auth/login', this.login);
    this.router.post('/auth/refresh', this.refreshToken);
    this.router.post('/auth/forgot-password', this.forgotPassword);
    this.router.post('/auth/verify-reset-code', this.verifyResetCode);
    this.router.post('/auth/reset-password', this.resetPassword);
  }

  private handleError(res: Response, error: unknown): void {
    if (error instanceof AppError) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: (error as Error).message });
  }

  login = async (req: Request, res: Response): Promise<void> => {
    const data: ILoginRequest = req.body;

    try {
      const response = await this.authService.login(data);

      res.status(200).json(response);
    } catch (error) {
      res.status(401).json({
        status: 401,
        message: (error as Error).message,
      });
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    const data: IRefreshTokenRequest = req.body;
    try {
      const tokens = await this.authService.refreshToken(data);
      res.status(200).json(tokens);
    } catch (error) {
      res.status(401).json({ error: (error as Error).message });
    }
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const data: IForgotPasswordRequest = req.body;

    try {
      await this.authService.requestPasswordReset(data);
      res.status(200).json({
        message:
          'Se o e-mail informado estiver cadastrado, você receberá um código.',
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  verifyResetCode = async (req: Request, res: Response): Promise<void> => {
    const data: IVerifyResetCodeRequest = req.body;

    try {
      const response = await this.authService.verifyResetCode(data);
      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    const data: IResetPasswordRequest = req.body;

    try {
      await this.authService.resetPassword(data);
      res.status(200).json({ message: 'Senha atualizada com sucesso.' });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
