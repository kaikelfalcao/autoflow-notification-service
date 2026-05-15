import { MongoHealth } from './mongo.health';
import { Connection } from 'mongoose';

const makeConnection = (readyState: number) =>
  ({ readyState }) as unknown as Connection;

describe('MongoHealth', () => {
  it('should return true when connection is ready (state 1)', () => {
    const health = new MongoHealth(makeConnection(1));
    expect(health.isHealthy()).toBe(true);
  });

  it('should return false when connection is disconnected (state 0)', () => {
    const health = new MongoHealth(makeConnection(0));
    expect(health.isHealthy()).toBe(false);
  });

  it('should return false when connection is connecting (state 2)', () => {
    const health = new MongoHealth(makeConnection(2));
    expect(health.isHealthy()).toBe(false);
  });
});
