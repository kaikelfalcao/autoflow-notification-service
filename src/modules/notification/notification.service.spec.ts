import { NotificationRepository } from './infra/repositories/notification.repository';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let repo: jest.Mocked<NotificationRepository>;

  beforeEach(() => {
    repo = {
      create: jest.fn(async () => ({}) as never),
      findByOrderId: jest.fn(),
      incrementRetry: jest.fn(),
    } as unknown as jest.Mocked<NotificationRepository>;
    service = new NotificationService(repo);
  });

  it('grava LOG para order-created', async () => {
    await service.handleOrderCreated({
      payload: {
        orderId: 'o1',
        customerCpf: '12345678900',
        customerName: 'Maria',
      },
    });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'LOG',
        template: 'order-created',
        orderId: 'o1',
        customerCpf: '12345678900',
        status: 'SENT',
      }),
    );
  });

  it('grava EMAIL para budget-generated com total', async () => {
    await service.handleBudgetGenerated({
      payload: { orderId: 'o1', customerCpf: '12345678900', totalAmount: 500 },
    });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'EMAIL',
        template: 'budget-ready',
        variables: expect.objectContaining({ total: 500 }),
      }),
    );
  });

  it('grava LOG para budget-approved', async () => {
    await service.handleBudgetApproved({ payload: { orderId: 'o1' } });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'LOG',
        template: 'budget-approved',
      }),
    );
  });

  it('grava EMAIL para payment-link', async () => {
    await service.handlePaymentRequested({
      payload: {
        orderId: 'o1',
        customerCpf: '111',
        customerName: 'João',
        totalAmount: 1000,
      },
    });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'EMAIL',
        template: 'payment-link',
        variables: expect.objectContaining({ name: 'João', total: 1000 }),
      }),
    );
  });

  it('grava EMAIL para payment-confirmed', async () => {
    await service.handlePaymentConfirmed({ orderId: 'o1' });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'EMAIL',
        template: 'payment-confirmed',
      }),
    );
  });

  it('grava EMAIL para payment-failed com reason', async () => {
    await service.handlePaymentFailed({
      orderId: 'o1',
      reason: 'card_declined',
    });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'EMAIL',
        template: 'payment-failed',
        variables: expect.objectContaining({ reason: 'card_declined' }),
      }),
    );
  });

  it('payment-failed funciona sem reason explícito', async () => {
    await service.handlePaymentFailed({ orderId: 'o1' });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({ reason: '' }),
      }),
    );
  });

  it('grava LOG para order-cancelled', async () => {
    await service.handleOrderCancelled({
      payload: { orderId: 'o1', reason: 'admin' },
    });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'LOG',
        template: 'order-cancelled',
        variables: expect.objectContaining({ reason: 'admin' }),
      }),
    );
  });

  it('grava EMAIL com customerCpf=ADMIN para low-stock-alert', async () => {
    await service.handleLowStockAlert({
      payload: {
        partId: 'p1',
        sku: 'SKU-1',
        name: 'Disco',
        currentStock: 2,
        minimumStock: 5,
      },
    });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'EMAIL',
        template: 'low-stock-alert',
        customerCpf: 'ADMIN',
        variables: expect.objectContaining({
          sku: 'SKU-1',
          current: 2,
          minimum: 5,
        }),
      }),
    );
  });

  it('usa customerCpf="unknown" quando cpf vier vazio', async () => {
    await service.handleOrderCreated({ payload: { orderId: 'o1' } });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ customerCpf: 'unknown' }),
    );
  });
});
