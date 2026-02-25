import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { FraudService } from './fraud.service';
import { Transaction } from '../transactions/entities';

describe('FraudService', () => {
  let service: FraudService;
  let warnSpy: jest.SpyInstance;

  const mockRepository = {
    count: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: number) => defaultValue),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FraudService,
        { provide: getRepositoryToken(Transaction), useValue: mockRepository },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<FraudService>(FraudService);
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    jest.clearAllMocks();
    mockConfigService.get.mockImplementation((_key: string, defaultValue: number) => defaultValue);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('should NOT log a warning when count is below threshold', async () => {
    mockRepository.count.mockResolvedValue(2);

    await service.checkFraud('user-1');

    expect(mockRepository.count).toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should log a warning when count meets the threshold', async () => {
    mockRepository.count.mockResolvedValue(3);

    await service.checkFraud('user-1');

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Fraud alert: userId=user-1'));
  });

  it('should log a warning when count exceeds the threshold', async () => {
    mockRepository.count.mockResolvedValue(5);

    await service.checkFraud('user-1');

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Fraud alert: userId=user-1'));
  });

  it('should use custom config values', async () => {
    mockConfigService.get.mockImplementation((key: string) => {
      const config: Record<string, number> = {
        FRAUD_TIME_WINDOW_MINUTES: 10,
        FRAUD_MAX_TRANSACTIONS: 5,
        FRAUD_AMOUNT_THRESHOLD: 2000,
      };
      return config[key];
    });
    mockRepository.count.mockResolvedValue(5);

    await service.checkFraud('user-1');

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('> 2000'));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('last 10 minutes'));
  });

  it('should use EntityManager when provided', async () => {
    const managerRepo = { count: jest.fn().mockResolvedValue(1) };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const manager = { getRepository: jest.fn().mockReturnValue(managerRepo) } as any;

    await service.checkFraud('user-1', manager);

    expect(manager.getRepository).toHaveBeenCalledWith(Transaction);
    expect(managerRepo.count).toHaveBeenCalled();
    expect(mockRepository.count).not.toHaveBeenCalled();
  });
});
