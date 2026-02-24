import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Transaction } from './entities';
import { TransactionType } from './entities';
import { User } from '../users/entities/user.entity';
import { CreateTransactionDto } from './dto';

/** Response shape for a created transaction. */
export interface TransactionResponse {
  transactionId: string;
  userId: string;
  amount: number;
  type: TransactionType;
  timestamp: Date;
  balanceAfter: number;
}

/** Handles transaction business logic with atomic balance updates and idempotency. */
@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    private readonly dataSource: DataSource,
  ) {}

  /** Creates a transaction with atomic balance update. Idempotent on `transactionId`. */
  async create(dto: CreateTransactionDto): Promise<TransactionResponse> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Idempotency check
      const existing = await manager.findOne(Transaction, {
        where: { transactionId: dto.transactionId },
      });

      if (existing) {
        const user = await manager.findOne(User, { where: { userId: dto.userId } });
        this.logger.log(`Idempotent hit: transactionId=${dto.transactionId} already exists`);
        return this.toResponse(existing, user?.balance ?? 0);
      }

      // 2. Lock user row for concurrent safety
      let user = await manager
        .getRepository(User)
        .createQueryBuilder('user')
        .setLock('pessimistic_write')
        .where('user.user_id = :userId', { userId: dto.userId })
        .getOne();

      // 3. Handle user not found
      if (!user && dto.type === TransactionType.DEPOSIT) {
        user = manager.create(User, { userId: dto.userId, balance: 0 });
        user = await manager.save(User, user);
        this.logger.log(`Created new user: userId=${dto.userId}`);
      }

      if (!user) {
        this.logger.warn(`Withdraw attempt on non-existent user: userId=${dto.userId}`);
        throw new NotFoundException(`User ${dto.userId} not found`);
      }

      // 4. Insufficient balance check
      if (dto.type === TransactionType.WITHDRAW && user.balance < dto.amount) {
        this.logger.warn(
          `Insufficient balance: userId=${dto.userId}, balance=${user.balance}, amount=${dto.amount}`,
        );
        throw new BadRequestException(
          `Insufficient balance. Current: ${user.balance}, requested: ${dto.amount}`,
        );
      }

      // 5. Atomic balance update
      const sign = dto.type === TransactionType.DEPOSIT ? 1 : -1;
      await manager
        .createQueryBuilder()
        .update(User)
        .set({ balance: () => `balance + ${sign * dto.amount}` })
        .where('user_id = :userId', { userId: dto.userId })
        .execute();

      // 6. Insert transaction
      const transaction = manager.create(Transaction, {
        transactionId: dto.transactionId,
        userId: dto.userId,
        amount: dto.amount,
        type: dto.type,
        timestamp: new Date(dto.timestamp),
      });
      await manager.save(Transaction, transaction);

      // 7. Read updated balance
      const updatedUser = await manager.findOneOrFail(User, {
        where: { userId: dto.userId },
      });

      this.logger.log(
        `Transaction created: transactionId=${dto.transactionId}, userId=${dto.userId}, type=${dto.type}, amount=${dto.amount}`,
      );

      return this.toResponse(transaction, updatedUser.balance);
    });
  }

  /** Returns all transactions for a user, ordered by timestamp descending. */
  async findByUserId(userId: string): Promise<Transaction[]> {
    const user = await this.dataSource.getRepository(User).findOne({ where: { userId } });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    return this.transactionsRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
    });
  }

  private toResponse(transaction: Transaction, balanceAfter: number): TransactionResponse {
    return {
      transactionId: transaction.transactionId,
      userId: transaction.userId,
      amount: transaction.amount,
      type: transaction.type,
      timestamp: transaction.timestamp,
      balanceAfter,
    };
  }
}
