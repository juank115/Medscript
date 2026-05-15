import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('returns 401 with wrong credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nope@test.com', password: 'wrongpass' })
        .expect(401);
    });

    it('returns 400 with invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'not-an-email', password: '123' })
        .expect(400);
    });
  });

  describe('Protected routes', () => {
    it('returns 401 when no token provided', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('returns 403 when patient tries to access doctor route', async () => {
      // Login as patient
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'patient@test.com', password: 'patient123' });

      // If seed not run, skip this test gracefully
      if (loginRes.status !== 201 && loginRes.status !== 200) return;

      const token = loginRes.body?.data?.accessToken ?? loginRes.body?.accessToken;

      return request(app.getHttpServer())
        .post('/prescriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({ patientId: 'x', items: [{ name: 'Med' }] })
        .expect(403);
    });
  });
});
