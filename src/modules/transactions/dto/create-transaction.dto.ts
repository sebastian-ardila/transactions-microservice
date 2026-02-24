import { IsEnum, IsISO8601, IsPositive, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '../entities';

/** DTO for creating a new transaction. */
export class CreateTransactionDto {
  @ApiProperty({
    description: 'Unique transaction identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  transactionId: string;

  @ApiProperty({
    description: 'User who owns the transaction',
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Transaction amount (must be positive)', example: 100.0 })
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Transaction type',
    enum: TransactionType,
    example: TransactionType.DEPOSIT,
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({
    description: 'Event timestamp in ISO 8601 format',
    example: '2026-02-24T12:00:00.000Z',
  })
  @IsISO8601()
  timestamp: string;
}
