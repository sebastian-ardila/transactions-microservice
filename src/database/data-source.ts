import 'dotenv/config';
import { DataSource } from 'typeorm';

/**
 * Standalone DataSource for TypeORM CLI (migrations).
 * Runs outside NestJS, so it reads process.env directly.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['dist/modules/**/entities/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
});
