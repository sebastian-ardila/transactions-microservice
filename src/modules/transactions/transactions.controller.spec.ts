import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TransactionType } from './entities';
import { CreateTransactionDto } from './dto';

describe('TransactionsController', () => {
  let controller: TransactionsController;

  const mockTransactionsService = {
    create: jest.fn(),
    findByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [{ provide: TransactionsService, useValue: mockTransactionsService }],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a transaction and return the response', async () => {
      const dto: CreateTransactionDto = {
        transactionId: 'txn-uuid-1',
        userId: 'user-uuid-1',
        amount: 100,
        type: TransactionType.DEPOSIT,
        timestamp: '2026-02-24T12:00:00.000Z',
      };
      const expected = {
        transactionId: 'txn-uuid-1',
        userId: 'user-uuid-1',
        amount: 100,
        type: TransactionType.DEPOSIT,
        timestamp: new Date('2026-02-24T12:00:00.000Z'),
        balanceAfter: 100,
      };
      mockTransactionsService.create.mockResolvedValue(expected);

      const result = await controller.create(dto);

      expect(result).toEqual(expected);
      expect(mockTransactionsService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findByUserId', () => {
    it('should return transactions for a user', async () => {
      const transactions = [{ transactionId: 'txn-1', userId: 'user-uuid-1' }];
      mockTransactionsService.findByUserId.mockResolvedValue(transactions);

      const result = await controller.findByUserId('user-uuid-1');

      expect(result).toEqual(transactions);
      expect(mockTransactionsService.findByUserId).toHaveBeenCalledWith('user-uuid-1');
    });
  });
});
