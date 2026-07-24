import { IHealthUnit } from '../../domain/health-unit/interfaces/health-unit.interface';
import { IHealthUnitRepository } from '../../domain/health-unit/repository/health-unit.repository.interface';
import { HealthUnitService } from '../../domain/health-unit/service/health-unit.service';

describe('HealthUnitService', () => {
  it('should return only the health units created by the requested user', async () => {
    const healthUnits: IHealthUnit[] = [
      {
        _id: 'health-unit-1',
        userId: 'user-1',
        name: 'Central Health Unit',
        address: {
          street: 'Main Street',
          number: '1',
          neighborhood: 'Downtown',
          city: 'Sao Paulo',
          state: 'SP',
          zipCode: '01000-000',
        },
        phone: '11999999999',
        email: 'central@example.com',
        services: [],
      },
    ];
    const getHealthUnitsByUserId = jest.fn().mockResolvedValue(healthUnits);
    const repository = {
      getHealthUnitsByUserId,
    } as unknown as IHealthUnitRepository;
    const service = new HealthUnitService({ healthRepository: repository });

    await expect(service.getHealthUnitsByUserId('user-1')).resolves.toEqual(
      healthUnits,
    );
    expect(getHealthUnitsByUserId).toHaveBeenCalledWith('user-1');
  });
});
