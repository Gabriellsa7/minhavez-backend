import { IController } from '../../../../interfaces/http/controllers/IController';
import { RatingController } from '../../../../interfaces/http/controllers/rating.controller';
import { RatingServiceFactory } from './rating.service.factory';

export class RatingControllerFactory {
  static create(): IController {
    return new RatingController(RatingServiceFactory.create());
  }
}
