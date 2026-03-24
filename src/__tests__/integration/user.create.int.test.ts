import supertest from 'supertest';
import { app } from '../../../jest/setup-integration-tests';
import { MUser } from '../../infrastructure/db/mongo/models/user.model';
import { IParamsCreateUser } from '../../domain/user/repository/user.repository.interface';
let paramsCreate: IParamsCreateUser;

beforeEach(async () => {
  await MUser.deleteMany({});
  paramsCreate = {
    email: 'whitebeard@email.com',
    name: 'Whitebeard',
    password: '12345678',
  };
});

describe('When we try to create a valid user', () => {
  it('should return success when we try to create a valid user', async () => {
    const { body, statusCode } = await supertest(app.app)
      .post(`/users`)
      .send(paramsCreate);

    const userInDb = await MUser.findOne({
      email: paramsCreate.email,
    });

    expect(statusCode).toBe(201);

    expect(body).toMatchObject({
      name: paramsCreate.name,
      email: paramsCreate.email,
    });

    expect(body).toHaveProperty('createdAt');
    expect(body).not.toHaveProperty('password');

    expect(userInDb).toBeTruthy();
    expect(userInDb?.password).not.toBe(paramsCreate.password);
  });
});
