import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';

/** Registers the Transaction entity, service, and controller. */
@Module({
  imports: [TypeOrmModule.forFeature([Transaction])],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TypeOrmModule],
})
export class TransactionsModule {}
