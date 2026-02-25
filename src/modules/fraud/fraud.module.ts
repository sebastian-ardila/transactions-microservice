import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../transactions/entities';
import { FraudService } from './fraud.service';

/** Registers the fraud detection service. */
@Module({
  imports: [TypeOrmModule.forFeature([Transaction])],
  providers: [FraudService],
  exports: [FraudService],
})
export class FraudModule {}
