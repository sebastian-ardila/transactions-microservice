import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TransactionType } from './transaction-type.enum';

/** Represents a financial transaction (deposit or withdrawal). */
@Entity('transactions')
export class Transaction {
  @PrimaryColumn('uuid', { name: 'transaction_id' })
  transactionId: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: { to: (value: number) => value, from: (value: string) => parseFloat(value) },
  })
  amount: number;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'timestamptz', name: 'timestamp' })
  timestamp: Date;

  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
