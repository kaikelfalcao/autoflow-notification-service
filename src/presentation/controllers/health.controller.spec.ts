import { HealthController } from './health.controller';
import { MongoHealth } from '../../infrastructure/health/mongo.health';

describe('HealthController', () => {
  let controller: HealthController;
  let mongoHealth: jest.Mocked<MongoHealth>;

  beforeEach(() => {
    mongoHealth = {
      isHealthy: jest.fn(),
    } as unknown as jest.Mocked<MongoHealth>;
    controller = new HealthController(mongoHealth);
  });

  describe('liveness', () => {
    it('should always return ok', () => {
      const result = controller.liveness();
      expect(result).toEqual({ status: 'ok' });
    });
  });

  describe('readiness', () => {
    it('should return ok and mongo true when database is connected', () => {
      mongoHealth.isHealthy.mockReturnValue(true);

      const result = controller.readiness();

      expect(result).toEqual({ status: 'ok', mongo: true });
    });

    it('should return degraded and mongo false when database is disconnected', () => {
      mongoHealth.isHealthy.mockReturnValue(false);

      const result = controller.readiness();

      expect(result).toEqual({ status: 'degraded', mongo: false });
    });
  });
});
