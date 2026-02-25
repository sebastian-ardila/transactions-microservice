import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { getMetadataArgsStorage } from 'typeorm';
import { randomUUID } from 'crypto';
import { User } from '../src/modules/users/entities/user.entity';
import { Transaction } from '../src/modules/transactions/entities/transaction.entity';
import { HealthModule } from '../src/modules/health';
import { UsersModule } from '../src/modules/users';
import { TransactionsModule } from '../src/modules/transactions';
import { AllExceptionsFilter } from '../src/common/filters';

import { SelectQueryBuilder } from 'typeorm';

/**
 * Patch TypeORM column metadata so PostgreSQL-specific types work with SQLite.
 * Must run before TypeORM initializes the DataSource.
 */
function patchMetadataForSqlite(): void {
  const columns = getMetadataArgsStorage().columns;
  for (const col of columns) {
    if (col.options.type === 'enum') {
      col.options.type = 'text';
      delete col.options.enum;
    }
    if (col.options.type === 'timestamptz') {
      col.options.type = 'datetime';
    }
  }

  // SQLite does not support pessimistic locking — make setLock a no-op.
  const originalSetLock = SelectQueryBuilder.prototype.setLock;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (SelectQueryBuilder.prototype as any).setLock = function (...args: any[]) {
    if (this.connection?.options?.type === 'better-sqlite3') {
      return this;
    }
    return originalSetLock.apply(this, args);
  };
}

patchMetadataForSqlite();

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              NODE_ENV: 'test',
              PORT: 3000,
              DB_USER: 'test',
              DB_PASSWORD: 'test',
              DB_NAME: 'test',
              DB_PORT: 5432,
              DATABASE_URL: 'sqlite://:memory:',
            }),
          ],
        }),
        LoggerModule.forRoot({ pinoHttp: { level: 'silent' } }),
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [User, Transaction],
          synchronize: true,
        }),
        HealthModule,
        UsersModule,
        TransactionsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------------------------------------------------------------------------
  // Health endpoints
  // ---------------------------------------------------------------------------

  describe('Health', () => {
    it('GET /health → 200 with status and timestamp', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.timestamp).toBeDefined();
        });
    });

    it('GET /health/live → 200', () => {
      return request(app.getHttpServer())
        .get('/health/live')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
        });
    });

    it('GET /health/ready → 200', () => {
      return request(app.getHttpServer())
        .get('/health/ready')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
        });
    });

    it('GET /non-existent-route → 404 with normalized error format', () => {
      return request(app.getHttpServer())
        .get('/non-existent-route')
        .expect(404)
        .expect((res) => {
          expect(res.body.statusCode).toBe(404);
          expect(res.body.message).toBeDefined();
          expect(res.body.error).toBeDefined();
          expect(res.body.path).toBe('/non-existent-route');
          expect(res.body.timestamp).toBeDefined();
        });
    });
  });

  // ---------------------------------------------------------------------------
  // Transaction flow
  // ---------------------------------------------------------------------------

  describe('Transactions', () => {
    const userId = randomUUID();
    const depositId = randomUUID();
    const withdrawId = randomUUID();

    it('POST /transactions (deposit) → 201, creates user, returns balanceAfter', () => {
      return request(app.getHttpServer())
        .post('/transactions')
        .send({
          transactionId: depositId,
          userId,
          amount: 500,
          type: 'deposit',
          timestamp: '2026-02-25T10:00:00.000Z',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.transactionId).toBe(depositId);
          expect(res.body.userId).toBe(userId);
          expect(res.body.amount).toBe(500);
          expect(res.body.type).toBe('deposit');
          expect(res.body.balanceAfter).toBe(500);
        });
    });

    it('GET /users/:userId/balance → 200 with correct balance', () => {
      return request(app.getHttpServer())
        .get(`/users/${userId}/balance`)
        .expect(200)
        .expect((res) => {
          expect(res.body.userId).toBe(userId);
          expect(res.body.balance).toBe(500);
        });
    });

    it('GET /transactions/user/:userId → 200 with transaction history', () => {
      return request(app.getHttpServer())
        .get(`/transactions/user/${userId}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(1);
          expect(res.body[0].transactionId).toBe(depositId);
        });
    });

    it('POST /transactions (second deposit) → 201, balance accumulates', () => {
      return request(app.getHttpServer())
        .post('/transactions')
        .send({
          transactionId: randomUUID(),
          userId,
          amount: 100,
          type: 'deposit',
          timestamp: '2026-02-25T10:30:00.000Z',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.balanceAfter).toBe(600);
        });
    });

    it('POST /transactions (withdraw) → 201, reduces balance', () => {
      return request(app.getHttpServer())
        .post('/transactions')
        .send({
          transactionId: withdrawId,
          userId,
          amount: 200,
          type: 'withdraw',
          timestamp: '2026-02-25T11:00:00.000Z',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.type).toBe('withdraw');
          expect(res.body.balanceAfter).toBe(400);
        });
    });

    it('GET /transactions/user/:userId → ordered by timestamp DESC', () => {
      return request(app.getHttpServer())
        .get(`/transactions/user/${userId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(3);
          const timestamps = res.body.map((t: { timestamp: string }) => t.timestamp);
          expect(new Date(timestamps[0]).getTime()).toBeGreaterThanOrEqual(
            new Date(timestamps[1]).getTime(),
          );
        });
    });
  });

  // ---------------------------------------------------------------------------
  // Error cases
  // ---------------------------------------------------------------------------

  describe('Error cases', () => {
    it('POST /transactions (withdraw, insufficient balance) → 400', () => {
      const userId = randomUUID();
      const depositId = randomUUID();

      return request(app.getHttpServer())
        .post('/transactions')
        .send({
          transactionId: depositId,
          userId,
          amount: 100,
          type: 'deposit',
          timestamp: '2026-02-25T10:00:00.000Z',
        })
        .expect(201)
        .then(() =>
          request(app.getHttpServer())
            .post('/transactions')
            .send({
              transactionId: randomUUID(),
              userId,
              amount: 999,
              type: 'withdraw',
              timestamp: '2026-02-25T11:00:00.000Z',
            })
            .expect(400)
            .expect((res) => {
              expect(res.body.statusCode).toBe(400);
              expect(res.body.message).toContain('Insufficient balance');
              expect(res.body.error).toBeDefined();
              expect(res.body.path).toBeDefined();
              expect(res.body.timestamp).toBeDefined();
            }),
        );
    });

    it('POST /transactions (withdraw, non-existent user) → 404', () => {
      return request(app.getHttpServer())
        .post('/transactions')
        .send({
          transactionId: randomUUID(),
          userId: randomUUID(),
          amount: 50,
          type: 'withdraw',
          timestamp: '2026-02-25T10:00:00.000Z',
        })
        .expect(404)
        .expect((res) => {
          expect(res.body.statusCode).toBe(404);
          expect(res.body.message).toContain('not found');
        });
    });

    it('GET /users/:userId/balance (non-existent user) → 404', () => {
      return request(app.getHttpServer())
        .get(`/users/${randomUUID()}/balance`)
        .expect(404)
        .expect((res) => {
          expect(res.body.statusCode).toBe(404);
        });
    });

    it('GET /transactions/user/:userId (non-existent user) → 404', () => {
      return request(app.getHttpServer())
        .get(`/transactions/user/${randomUUID()}`)
        .expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  // Idempotency
  // ---------------------------------------------------------------------------

  describe('Idempotency', () => {
    it('Repeated POST with same transactionId returns same response', async () => {
      const userId = randomUUID();
      const txId = randomUUID();
      const payload = {
        transactionId: txId,
        userId,
        amount: 250,
        type: 'deposit',
        timestamp: '2026-02-25T12:00:00.000Z',
      };

      const first = await request(app.getHttpServer())
        .post('/transactions')
        .send(payload)
        .expect(201);

      const second = await request(app.getHttpServer())
        .post('/transactions')
        .send(payload)
        .expect(201);

      expect(first.body.transactionId).toBe(second.body.transactionId);
      expect(first.body.balanceAfter).toBe(second.body.balanceAfter);

      // Balance should not have doubled
      const balance = await request(app.getHttpServer())
        .get(`/users/${userId}/balance`)
        .expect(200);

      expect(balance.body.balance).toBe(250);
    });
  });

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  describe('Validation', () => {
    it('POST /transactions with missing fields → 400', () => {
      return request(app.getHttpServer())
        .post('/transactions')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
          expect(res.body.message).toBeDefined();
        });
    });

    it('POST /transactions with invalid UUID → 400', () => {
      return request(app.getHttpServer())
        .post('/transactions')
        .send({
          transactionId: 'not-a-uuid',
          userId: 'also-not-uuid',
          amount: 100,
          type: 'deposit',
          timestamp: '2026-02-25T10:00:00.000Z',
        })
        .expect(400);
    });

    it('POST /transactions with negative amount → 400', () => {
      return request(app.getHttpServer())
        .post('/transactions')
        .send({
          transactionId: randomUUID(),
          userId: randomUUID(),
          amount: -50,
          type: 'deposit',
          timestamp: '2026-02-25T10:00:00.000Z',
        })
        .expect(400);
    });

    it('POST /transactions with invalid type → 400', () => {
      return request(app.getHttpServer())
        .post('/transactions')
        .send({
          transactionId: randomUUID(),
          userId: randomUUID(),
          amount: 100,
          type: 'transfer',
          timestamp: '2026-02-25T10:00:00.000Z',
        })
        .expect(400);
    });

    it('POST /transactions with invalid timestamp → 400', () => {
      return request(app.getHttpServer())
        .post('/transactions')
        .send({
          transactionId: randomUUID(),
          userId: randomUUID(),
          amount: 100,
          type: 'deposit',
          timestamp: 'not-a-date',
        })
        .expect(400);
    });

    it('POST /transactions with unknown fields → 400 (forbidNonWhitelisted)', () => {
      return request(app.getHttpServer())
        .post('/transactions')
        .send({
          transactionId: randomUUID(),
          userId: randomUUID(),
          amount: 100,
          type: 'deposit',
          timestamp: '2026-02-25T10:00:00.000Z',
          extraField: 'should be rejected',
        })
        .expect(400);
    });

    it('GET /users/:userId/balance with invalid UUID → 400', () => {
      return request(app.getHttpServer()).get('/users/not-a-uuid/balance').expect(400);
    });

    it('GET /transactions/user/:userId with invalid UUID → 400', () => {
      return request(app.getHttpServer()).get('/transactions/user/not-a-uuid').expect(400);
    });
  });
});
