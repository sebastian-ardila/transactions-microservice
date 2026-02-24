import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return status ok', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(result.timestamp).toBeDefined();
  });

  it('should return ok for liveness probe', () => {
    const result = controller.live();
    expect(result.status).toBe('ok');
  });

  it('should return ok for readiness probe', () => {
    const result = controller.ready();
    expect(result.status).toBe('ok');
  });
});
