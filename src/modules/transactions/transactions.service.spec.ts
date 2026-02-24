import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionType } from './entities';
import { User } from '../users/entities/user.entity';
import { CreateTransactionDto } from './dto';

describe('TransactionsService', () => {
  let service: TransactionsService;

  const mockTransactionsRepository = {
    find: jest.fn(),
  };

  // Helpers for the transaction manager mock
  let managerMocks: {
    findOne: jest.Mock;
    findOneOrFail: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    getRepository: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  const mockDataSource = {
    transaction: jest.fn(),
    getRepository: jest.fn(),
  };

  const baseDto: CreateTransactionDto = {
    transactionId: 'txn-uuid-1',
    userId: 'user-uuid-1',
    amount: 100,
    type: TransactionType.DEPOSIT,
    timestamp: '2026-02-24T12:00:00.000Z',
  };

  const mockUser: User = {
    userId: 'user-uuid-1',
    balance: 500,
    createdAt: new Date(),
    updatedAt: new Date(),
    transactions: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: getRepositoryToken(Transaction), useValue: mockTransactionsRepository },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);

    // Setup manager mock used inside dataSource.transaction callback
    managerMocks = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      create: jest.fn((_, data) => data),
      save: jest.fn((_, data) => Promise.resolve(data)),
      getRepository: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockDataSource.transaction.mockImplementation((cb) => cb(managerMocks));

    jest.clearAllMocks();
    // Re-setup after clearAllMocks
    mockDataSource.transaction.mockImplementation((cb) => cb(managerMocks));
  });

  describe('create', () => {
    const setupManagerForCreate = (user: User | null, existingTxn: Transaction | null = null) => {
      // findOne is called twice: first for idempotency check (Transaction), then for lock (User via queryBuilder)
      managerMocks.findOne.mockResolvedValueOnce(existingTxn); // idempotency check

      const qb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      };
      managerMocks.getRepository.mockReturnValue({ createQueryBuilder: () => qb });

      const updateQb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };
      managerMocks.createQueryBuilder.mockReturnValue(updateQb);

      managerMocks.create.mockImplementation((_, data) => ({
        ...data,
        timestamp: data.timestamp instanceof Date ? data.timestamp : new Date(data.timestamp),
      }));
      managerMocks.save.mockImplementation((_, data) => Promise.resolve(data));
    };

    it('should create a deposit for an existing user', async () => {
      setupManagerForCreate(mockUser);
      managerMocks.findOneOrFail.mockResolvedValue({ ...mockUser, balance: 600 });

      const result = await service.create(baseDto);

      expect(result.transactionId).toBe('txn-uuid-1');
      expect(result.userId).toBe('user-uuid-1');
      expect(result.amount).toBe(100);
      expect(result.type).toBe(TransactionType.DEPOSIT);
      expect(result.balanceAfter).toBe(600);
    });

    it('should create user on deposit if user does not exist', async () => {
      setupManagerForCreate(null); // user not found
      managerMocks.save.mockImplementation((_, data) =>
        Promise.resolve({ ...data, balance: data.balance ?? 0 }),
      );
      managerMocks.findOneOrFail.mockResolvedValue({ userId: 'user-uuid-1', balance: 100 });

      const result = await service.create(baseDto);

      expect(result.balanceAfter).toBe(100);
      expect(managerMocks.create).toHaveBeenCalledWith(User, {
        userId: 'user-uuid-1',
        balance: 0,
      });
    });

    it('should create a withdrawal for an existing user with sufficient balance', async () => {
      const withdrawDto: CreateTransactionDto = {
        ...baseDto,
        type: TransactionType.WITHDRAW,
        amount: 200,
      };
      setupManagerForCreate(mockUser);
      managerMocks.findOneOrFail.mockResolvedValue({ ...mockUser, balance: 300 });

      const result = await service.create(withdrawDto);

      expect(result.type).toBe(TransactionType.WITHDRAW);
      expect(result.balanceAfter).toBe(300);
    });

    it('should throw BadRequestException on withdraw with insufficient balance', async () => {
      const withdrawDto: CreateTransactionDto = {
        ...baseDto,
        type: TransactionType.WITHDRAW,
        amount: 9999,
      };
      setupManagerForCreate(mockUser);

      await expect(service.create(withdrawDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException on withdraw for non-existent user', async () => {
      const withdrawDto: CreateTransactionDto = {
        ...baseDto,
        type: TransactionType.WITHDRAW,
      };
      setupManagerForCreate(null);

      await expect(service.create(withdrawDto)).rejects.toThrow(NotFoundException);
    });

    it('should return existing transaction on idempotent call', async () => {
      const existingTxn: Transaction = {
        transactionId: 'txn-uuid-1',
        userId: 'user-uuid-1',
        amount: 100,
        type: TransactionType.DEPOSIT,
        timestamp: new Date('2026-02-24T12:00:00.000Z'),
        user: mockUser,
      };

      // For idempotent hit: findOne returns existing txn, then finds user for balance
      managerMocks.findOne
        .mockResolvedValueOnce(existingTxn) // idempotency check
        .mockResolvedValueOnce(mockUser); // user lookup for balance

      const result = await service.create(baseDto);

      expect(result.transactionId).toBe('txn-uuid-1');
      expect(result.balanceAfter).toBe(500);
    });
  });

  describe('findByUserId', () => {
    it('should return transactions ordered by timestamp DESC', async () => {
      const transactions: Transaction[] = [
        {
          transactionId: 'txn-2',
          userId: 'user-uuid-1',
          amount: 50,
          type: TransactionType.WITHDRAW,
          timestamp: new Date('2026-02-24T13:00:00.000Z'),
          user: mockUser,
        },
        {
          transactionId: 'txn-1',
          userId: 'user-uuid-1',
          amount: 100,
          type: TransactionType.DEPOSIT,
          timestamp: new Date('2026-02-24T12:00:00.000Z'),
          user: mockUser,
        },
      ];

      mockDataSource.getRepository.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(mockUser),
      });
      mockTransactionsRepository.find.mockResolvedValue(transactions);

      const result = await service.findByUserId('user-uuid-1');

      expect(result).toHaveLength(2);
      expect(mockTransactionsRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1' },
        order: { timestamp: 'DESC' },
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockDataSource.getRepository.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findByUserId('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
