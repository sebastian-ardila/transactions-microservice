import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { envValidationSchema } from './config/env.validation';
import { loggerConfig } from './config/logger.config';
import { DatabaseModule } from './database';
import { HealthModule } from './modules/health';
import { UsersModule } from './modules/users';
import { TransactionsModule } from './modules/transactions';

/** Root module — registers global config, structured logging, and feature modules. */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    LoggerModule.forRoot(loggerConfig),
    DatabaseModule,
    HealthModule,
    UsersModule,
    TransactionsModule,
  ],
})
export class AppModule {}
