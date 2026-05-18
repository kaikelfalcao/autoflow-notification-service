import type { Model } from 'mongoose';

import type { Notification } from '../schemas/notification.schema';
import { NotificationRepository } from './notification.repository';

describe('NotificationRepository', () => {
  let model: jest.Mocked<Model<Notification>>;
  let repo: NotificationRepository;

  beforeEach(() => {
    model = {
      create: jest.fn(async (n: unknown) => n),
      find: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    } as unknown as jest.Mocked<Model<Notification>>;
    repo = new NotificationRepository(model);
  });

  it('create encaminha para o model', async () => {
    const data = {
      orderId: 'o1',
      customerCpf: '111',
      channel: 'EMAIL' as const,
      template: 'budget-ready',
      variables: {},
      status: 'SENT' as const,
      sentAt: new Date(),
    };
    await repo.create(data);
    expect(model.create).toHaveBeenCalledWith(data);
  });

  it('findByOrderId chama find().exec()', async () => {
    const exec = jest.fn(async () => [{ orderId: 'o1' }]);
    (model.find as jest.Mock).mockReturnValue({ exec });
    const result = await repo.findByOrderId('o1');
    expect(model.find).toHaveBeenCalledWith({ orderId: 'o1' });
    expect(exec).toHaveBeenCalled();
    expect(result).toEqual([{ orderId: 'o1' }]);
  });

  it('incrementRetry usa $inc.retryCount', async () => {
    (model.findByIdAndUpdate as jest.Mock).mockResolvedValue({ id: 'x' });
    await repo.incrementRetry('id-1');
    expect(model.findByIdAndUpdate).toHaveBeenCalledWith('id-1', {
      $inc: { retryCount: 1 },
    });
  });
});
