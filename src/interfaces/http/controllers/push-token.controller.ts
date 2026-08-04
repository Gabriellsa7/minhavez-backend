import { Request, Response, Router } from 'express';
import { IController } from './IController';
import { authMiddleware } from '../middlewary/auth.middleware';
import { PushTokenService } from '../../../domain/notification/service/push-token.service';

export class PushTokenController implements IController {
  router: Router;
  private readonly pushTokenService: PushTokenService;

  constructor(pushTokenService: PushTokenService) {
    this.pushTokenService = pushTokenService;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.post(
      '/notifications/register-token',
      authMiddleware,
      this.registerToken,
    );
  }

  registerToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, platform } = req.body;
      await this.pushTokenService.registerToken(req.user!.sub, token, platform);
      res.status(200).json({ message: 'Token registered' });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
