import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { FraudModule } from '../fraud';

/** Registers the Transaction entity, service, and controller. */
@Module({
  imports: [TypeOrmModule.forFeature([Transaction]), FraudModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TypeOrmModule],
})
export class TransactionsModule {}
