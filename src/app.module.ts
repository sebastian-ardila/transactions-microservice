import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { envValidationSchema } from './config/env.validation';
import { loggerConfig } from './config/logger.config';
import { HealthModule } from './modules/health';

/** Root module — registers global config, structured logging, and feature modules. */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    LoggerModule.forRoot(loggerConfig),
    HealthModule,
  ],
})
export class AppModule {}
