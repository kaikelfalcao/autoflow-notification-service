import { Injectable, Logger } from '@nestjs/common';

import { NotificationRepository } from './infra/repositories/notification.repository';

export interface EventEnvelope {
  eventId?: string;
  eventType?: string;
  correlationId?: string;
  source?: string;
  payload: Record<string, unknown>;
}

interface ResolvedNotification {
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH' | 'LOG';
  template: string;
  variables: Record<string, unknown>;
  customerCpf: string;
  orderId: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly repo: NotificationRepository) {}

  async handleOrderCreated(envelope: EventEnvelope): Promise<void> {
    const payload = envelope.payload as {
      orderId: string;
      customerCpf?: string;
      customerName?: string;
    };
    await this.dispatch({
      channel: 'LOG',
      template: 'order-created',
      variables: { name: payload.customerName ?? '', orderId: payload.orderId },
      customerCpf: payload.customerCpf ?? '',
      orderId: payload.orderId,
    });
  }

  async handleBudgetGenerated(envelope: EventEnvelope): Promise<void> {
    const payload = envelope.payload as {
      orderId: string;
      customerCpf?: string;
      totalAmount?: number;
    };
    await this.dispatch({
      channel: 'EMAIL',
      template: 'budget-ready',
      variables: { orderId: payload.orderId, total: payload.totalAmount },
      customerCpf: payload.customerCpf ?? '',
      orderId: payload.orderId,
    });
  }

  async handleBudgetApproved(envelope: EventEnvelope): Promise<void> {
    const payload = envelope.payload as { orderId: string };
    await this.dispatch({
      channel: 'LOG',
      template: 'budget-approved',
      variables: { orderId: payload.orderId },
      customerCpf: '',
      orderId: payload.orderId,
    });
  }

  async handlePaymentRequested(envelope: EventEnvelope): Promise<void> {
    const payload = envelope.payload as {
      orderId: string;
      customerCpf?: string;
      customerName?: string;
      totalAmount?: number;
    };
    await this.dispatch({
      channel: 'EMAIL',
      template: 'payment-link',
      variables: {
        name: payload.customerName ?? '',
        total: payload.totalAmount,
        orderId: payload.orderId,
      },
      customerCpf: payload.customerCpf ?? '',
      orderId: payload.orderId,
    });
  }

  async handlePaymentConfirmed(payload: { orderId: string }): Promise<void> {
    await this.dispatch({
      channel: 'EMAIL',
      template: 'payment-confirmed',
      variables: { orderId: payload.orderId },
      customerCpf: '',
      orderId: payload.orderId,
    });
  }

  async handlePaymentFailed(payload: {
    orderId: string;
    reason?: string;
  }): Promise<void> {
    await this.dispatch({
      channel: 'EMAIL',
      template: 'payment-failed',
      variables: { orderId: payload.orderId, reason: payload.reason ?? '' },
      customerCpf: '',
      orderId: payload.orderId,
    });
  }

  async handleOrderCancelled(envelope: EventEnvelope): Promise<void> {
    const payload = envelope.payload as { orderId: string; reason?: string };
    await this.dispatch({
      channel: 'LOG',
      template: 'order-cancelled',
      variables: { orderId: payload.orderId, reason: payload.reason ?? '' },
      customerCpf: '',
      orderId: payload.orderId,
    });
  }

  async handleLowStockAlert(envelope: EventEnvelope): Promise<void> {
    const payload = envelope.payload as {
      partId: string;
      sku: string;
      name: string;
      currentStock: number;
      minimumStock: number;
    };
    await this.dispatch({
      channel: 'EMAIL',
      template: 'low-stock-alert',
      variables: {
        sku: payload.sku,
        name: payload.name,
        current: payload.currentStock,
        minimum: payload.minimumStock,
      },
      customerCpf: 'ADMIN',
      orderId: payload.partId,
    });
  }

  private async dispatch(n: ResolvedNotification): Promise<void> {
    this.logger.log(
      `[${n.channel}] template=${n.template} order=${n.orderId} vars=${JSON.stringify(n.variables)}`,
    );
    await this.repo.create({
      orderId: n.orderId,
      customerCpf: n.customerCpf || 'unknown',
      channel: n.channel,
      template: n.template,
      variables: n.variables,
      status: 'SENT',
      sentAt: new Date(),
    });
  }
}
