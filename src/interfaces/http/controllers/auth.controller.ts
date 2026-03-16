import { Request, Response, Router } from 'express';
import { IController } from './IController';
import { IAuthService } from '../../../domain/auth/interfaces/auth.service.interface';
import {
  ILoginRequest,
  IRefreshTokenRequest,
} from '../../../domain/auth/interfaces/auth.interface';

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
  }

  login = async (req: Request, res: Response): Promise<void> => {
    const data: ILoginRequest = req.body;
    try {
      const tokens = await this.authService.login(data);
      res.status(200).json(tokens);
    } catch (error) {
      res.status(401).json({ error: (error as Error).message });
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

  public getRoutes(): Router {
    return this.router;
  }
}
