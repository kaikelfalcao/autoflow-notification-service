import { PushChannel } from './push.channel';

describe('PushChannel', () => {
  let channel: PushChannel;

  beforeEach(() => {
    channel = new PushChannel();
  });

  it('should support PUSH channel', () => {
    expect(channel.supports('PUSH')).toBe(true);
  });

  it('should not support EMAIL', () => {
    expect(channel.supports('EMAIL')).toBe(false);
  });

  it('should not support SMS', () => {
    expect(channel.supports('SMS')).toBe(false);
  });

  it('should resolve without throwing (stub implementation)', async () => {
    await expect(
      channel.send({ to: 'cpf-123', content: 'Test push', channel: 'PUSH' }),
    ).resolves.toBeUndefined();
  });
});
