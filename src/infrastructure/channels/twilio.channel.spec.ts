import { ConfigService } from '@nestjs/config';
import { TwilioChannel } from './twilio.channel';

const mockCreate = jest.fn().mockResolvedValue({ sid: 'SM-test' });

jest.mock('twilio', () => {
  return jest.fn(() => ({
    messages: { create: mockCreate },
  }));
});

const mockConfig = (values: Record<string, string>) =>
  ({
    getOrThrow: jest.fn((key: string) => {
      if (!values[key]) throw new Error(`Missing config: ${key}`);
      return values[key];
    }),
    get: jest.fn((key: string, def?: string) => values[key] ?? def),
  }) as unknown as ConfigService;

describe('TwilioChannel', () => {
  let channel: TwilioChannel;
  let config: ConfigService;

  beforeEach(() => {
    config = mockConfig({
      TWILIO_ACCOUNT_SID: 'ACtest',
      TWILIO_AUTH_TOKEN: 'token123',
      TWILIO_PHONE_NUMBER: '+5511900000000',
      TWILIO_WHATSAPP_NUMBER: 'whatsapp:+14155238886',
    });
    channel = new TwilioChannel(config);
    jest.clearAllMocks();
  });

  it('should support SMS channel', () => {
    expect(channel.supports('SMS')).toBe(true);
  });

  it('should support WHATSAPP channel', () => {
    expect(channel.supports('WHATSAPP')).toBe(true);
  });

  it('should not support EMAIL channel', () => {
    expect(channel.supports('EMAIL')).toBe(false);
  });

  it('should send SMS with correct from and to', async () => {
    await channel.send({
      to: '+5511999999999',
      content: 'Mensagem',
      channel: 'SMS',
    });

    expect(mockCreate).toHaveBeenCalledWith({
      body: 'Mensagem',
      from: '+5511900000000',
      to: '+5511999999999',
    });
  });

  it('should prefix WhatsApp numbers correctly', async () => {
    await channel.send({
      to: '+5511999999999',
      content: 'Mensagem WA',
      channel: 'WHATSAPP',
    });

    expect(mockCreate).toHaveBeenCalledWith({
      body: 'Mensagem WA',
      from: 'whatsapp:+14155238886',
      to: 'whatsapp:+5511999999999',
    });
  });

  it('should propagate errors from Twilio client', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Twilio error'));

    await expect(
      channel.send({ to: '+5511999999999', content: 'test', channel: 'SMS' }),
    ).rejects.toThrow('Twilio error');
  });
});
