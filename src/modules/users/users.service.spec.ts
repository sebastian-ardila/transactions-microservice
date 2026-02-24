import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities';

describe('UsersService', () => {
  let service: UsersService;

  const mockUser: User = {
    userId: 'user-uuid-1',
    balance: 500,
    createdAt: new Date(),
    updatedAt: new Date(),
    transactions: [],
  };

  const mockRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: getRepositoryToken(User), useValue: mockRepository }],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('user-uuid-1');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1' },
      });
    });

    it('should return null when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getBalance', () => {
    it('should return userId and balance', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getBalance('user-uuid-1');

      expect(result).toEqual({ userId: 'user-uuid-1', balance: 500 });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getBalance('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
