import { ConfigService } from '@nestjs/config';
import { SendGridChannel } from './sendgrid.channel';

jest.mock('@sendgrid/mail', () => ({
  __esModule: true,
  default: {
    setApiKey: jest.fn(),
    send: jest.fn(),
  },
}));

const getSgMock = () =>
  jest.requireMock('@sendgrid/mail').default as {
    setApiKey: jest.Mock;
    send: jest.Mock;
  };

const mockConfig = (values: Record<string, string>) =>
  ({
    getOrThrow: jest.fn((key: string) => {
      if (values[key] === undefined) throw new Error(`Missing config: ${key}`);
      return values[key];
    }),
    get: jest.fn((key: string, def?: string) => values[key] ?? def),
  }) as unknown as ConfigService;

describe('SendGridChannel', () => {
  let channel: SendGridChannel;

  beforeEach(() => {
    jest.clearAllMocks();
    getSgMock().send.mockResolvedValue([{ statusCode: 202 }]);

    channel = new SendGridChannel(
      mockConfig({
        SENDGRID_API_KEY: 'SG.test-key',
        SENDGRID_FROM_EMAIL: 'noreply@autoflow.com.br',
      }),
    );
  });

  it('should support EMAIL channel', () => {
    expect(channel.supports('EMAIL')).toBe(true);
  });

  it('should not support SMS channel', () => {
    expect(channel.supports('SMS')).toBe(false);
  });

  it('should call sgMail.send with correct parameters', async () => {
    await channel.send({
      to: 'cliente@test.com',
      subject: 'Orçamento',
      content: '<p>Olá</p>',
      channel: 'EMAIL',
    });

    expect(getSgMock().send).toHaveBeenCalledWith({
      to: 'cliente@test.com',
      from: 'noreply@autoflow.com.br',
      subject: 'Orçamento',
      html: '<p>Olá</p>',
    });
  });

  it('should use default subject when not provided', async () => {
    await channel.send({ to: 'a@b.com', content: 'msg', channel: 'EMAIL' });

    expect(getSgMock().send).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Notificação AutoFlow' }),
    );
  });

  it('should initialize API key lazily on first send', async () => {
    await channel.send({ to: 'a@b.com', content: 'test', channel: 'EMAIL' });

    expect(getSgMock().setApiKey).toHaveBeenCalledWith('SG.test-key');
  });

  it('should not reinitialize API key on subsequent sends', async () => {
    await channel.send({ to: 'a@b.com', content: '1', channel: 'EMAIL' });
    await channel.send({ to: 'b@c.com', content: '2', channel: 'EMAIL' });

    expect(getSgMock().setApiKey).toHaveBeenCalledTimes(1);
  });

  it('should propagate errors from sgMail.send', async () => {
    getSgMock().send.mockRejectedValueOnce(new Error('API error'));

    await expect(
      channel.send({ to: 'x@y.com', content: 'test', channel: 'EMAIL' }),
    ).rejects.toThrow('API error');
  });
});
