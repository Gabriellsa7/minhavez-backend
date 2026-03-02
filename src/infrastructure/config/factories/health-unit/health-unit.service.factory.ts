import { HealthUnitService } from '../../../../domain/health-unit/service/health-unit.service';
import { HealthUnitRepository } from '../../../repository/health-unit/health-unit.repository';

export class HealthUnitServiceFactory {
  static create() {
    const repoRead = new HealthUnitRepository();

    return new HealthUnitService({
      healthRepository: repoRead,
    });
  }
}
