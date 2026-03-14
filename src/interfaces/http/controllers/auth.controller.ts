import { Request, Response, Router } from 'express';
import { IController } from './IController';
import { IAuthService } from '../../../domain/auth/interfaces/auth.service.interface';
import { ILoginRequest } from '../../../domain/auth/interfaces/auth.interface';

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
    this.router.get('/users/me', this.getCurrentUser);
  }

  login = async (req: Request, res: Response): Promise<void> => {
    const data: ILoginRequest = req.body;
    try {
      const token = await this.authService.login(data);
      res.status(200).json(token);
    } catch (error) {
      res.status(401).json({ error: (error as Error).message });
    }
  };

  getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Missing authorization header' });
      return;
    }

    const token = authHeader.replace('Bearer ', '').trim();

    try {
      const userId = await this.authService.getUserFromToken(token);
      if (!userId) {
        res.status(401).json({ message: 'Invalid or expired token' });
        return;
      }

      // Return minimal response: user ID (client can call /users/{id} for full data)
      res.status(200).json({ id: userId });
    } catch (error) {
      res.status(401).json({ message: (error as Error).message });
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
