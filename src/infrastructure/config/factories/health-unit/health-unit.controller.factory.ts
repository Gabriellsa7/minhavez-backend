import { HealthUnitController } from '../../../../interfaces/http/controllers/health-unit.controller';
import { IController } from '../../../../interfaces/http/controllers/IController';
import { HealthUnitServiceFactory } from './health-unit.service.factory';

export class HealthUnitControllerFactory {
  static create(): IController {
    return new HealthUnitController(HealthUnitServiceFactory.create());
  }
}
