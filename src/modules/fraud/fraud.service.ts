import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { EntityManager, MoreThan, MoreThanOrEqual, Repository } from 'typeorm';
import { Transaction } from '../transactions/entities';

/** Evaluates basic fraud-detection rules and logs warnings for suspicious activity. */
@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Checks whether the given user has suspicious recent activity.
   * Triggers a warning log when the user exceeds the configured thresholds.
   * Does NOT block the transaction — alert-only.
   */
  async checkFraud(userId: string, manager?: EntityManager): Promise<void> {
    const windowMinutes = this.configService.get<number>('FRAUD_TIME_WINDOW_MINUTES', 5);
    const maxTransactions = this.configService.get<number>('FRAUD_MAX_TRANSACTIONS', 3);
    const amountThreshold = this.configService.get<number>('FRAUD_AMOUNT_THRESHOLD', 1000);

    const since = new Date(Date.now() - windowMinutes * 60 * 1000);
    const repo = manager?.getRepository(Transaction) ?? this.transactionsRepository;

    const count = await repo.count({
      where: {
        userId,
        amount: MoreThan(amountThreshold),
        timestamp: MoreThanOrEqual(since),
      },
    });

    if (count >= maxTransactions) {
      this.logger.warn(
        `Fraud alert: userId=${userId} has ${count} transactions > ${amountThreshold} in the last ${windowMinutes} minutes`,
      );
    }
  }
}
