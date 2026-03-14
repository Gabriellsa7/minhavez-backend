import { IController } from '../../../../interfaces/http/controllers/IController';
import { AuthController } from '../../../../interfaces/http/controllers/auth.controller';
import { AuthServiceFactory } from './auth.service.factory';

export class AuthControllerFactory {
  static create(): IController {
    return new AuthController(AuthServiceFactory.create());
  }
}
