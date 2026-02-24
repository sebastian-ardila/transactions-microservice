import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities';

/** Registers the Transaction entity and exposes transaction-related providers. */
@Module({
  imports: [TypeOrmModule.forFeature([Transaction])],
  exports: [TypeOrmModule],
})
export class TransactionsModule {}
