import supertest from 'supertest';
import { app } from '../../../jest/setup-integration-tests';
import { Muser } from '../../infrastructure/db/mongo/models/user.model';
import { ICreateUser } from '../../domain/user/interfaces/user.interface';
let paramsCreate: ICreateUser;

beforeEach(async () => {
  await Muser.deleteMany({});
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

    const userInDb = await Muser.findOne({
      email: paramsCreate.email,
    });

    expect(statusCode).toBe(201);

    expect(body).toMatchObject({
      name: paramsCreate.name,
      email: paramsCreate.email,
    });

    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('createdAt');
    expect(body).not.toHaveProperty('password');

    expect(userInDb).toBeTruthy();
    expect(userInDb?.password).not.toBe(paramsCreate.password);
  });
});
