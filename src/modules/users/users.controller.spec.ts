import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    getBalance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('should return the user balance', async () => {
      const expected = { userId: 'user-uuid-1', balance: 250 };
      mockUsersService.getBalance.mockResolvedValue(expected);

      const result = await controller.getBalance('user-uuid-1');

      expect(result).toEqual(expected);
      expect(mockUsersService.getBalance).toHaveBeenCalledWith('user-uuid-1');
    });
  });
});
