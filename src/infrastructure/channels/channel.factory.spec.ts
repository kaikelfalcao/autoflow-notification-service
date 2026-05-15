import { ChannelFactory } from './channel.factory';
import { SendGridChannel } from './sendgrid.channel';
import { TwilioChannel } from './twilio.channel';
import { PushChannel } from './push.channel';

const makeChannel = (supported: string[]) => ({
  supports: jest.fn((ch: string) => supported.includes(ch)),
  send: jest.fn(),
});

describe('ChannelFactory', () => {
  let sendGrid: ReturnType<typeof makeChannel>;
  let twilio: ReturnType<typeof makeChannel>;
  let push: ReturnType<typeof makeChannel>;
  let factory: ChannelFactory;

  beforeEach(() => {
    sendGrid = makeChannel(['EMAIL']);
    twilio = makeChannel(['SMS', 'WHATSAPP']);
    push = makeChannel(['PUSH']);

    factory = new ChannelFactory(
      sendGrid as unknown as SendGridChannel,
      twilio as unknown as TwilioChannel,
      push as unknown as PushChannel,
    );
  });

  it('should return SendGridChannel for EMAIL', () => {
    expect(factory.getChannel('EMAIL')).toBe(sendGrid);
  });

  it('should return TwilioChannel for SMS', () => {
    expect(factory.getChannel('SMS')).toBe(twilio);
  });

  it('should return TwilioChannel for WHATSAPP', () => {
    expect(factory.getChannel('WHATSAPP')).toBe(twilio);
  });

  it('should return PushChannel for PUSH', () => {
    expect(factory.getChannel('PUSH')).toBe(push);
  });

  it('should throw for unsupported channel', () => {
    expect(() => factory.getChannel('PIGEON')).toThrow(
      'No channel adapter found for: PIGEON',
    );
  });
});
