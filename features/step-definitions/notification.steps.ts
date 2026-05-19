import { Then, When } from '@cucumber/cucumber';
import { strict as assert } from 'node:assert';

import type { NotificationWorld } from '../support/world';

When(
  /^chega evento order.created para a ordem "([^"]+)" do cliente "([^"]+)" cpf "([^"]+)"$/,
  async function (
    this: NotificationWorld,
    orderId: string,
    name: string,
    cpf: string,
  ) {
    await this.service.handleOrderCreated({
      payload: { orderId, customerName: name, customerCpf: cpf },
    });
  },
);

When(
  /^chega evento order.budget.generated para a ordem "([^"]+)" com total (\d+) centavos$/,
  async function (this: NotificationWorld, orderId: string, totalCents: string) {
    await this.service.handleBudgetGenerated({
      payload: { orderId, totalAmount: Number(totalCents) },
    });
  },
);

When(
  /^chega evento payment.confirmed para a ordem "([^"]+)"$/,
  async function (this: NotificationWorld, orderId: string) {
    await this.service.handlePaymentConfirmed({ orderId });
  },
);

When(
  /^chega evento payment.failed para a ordem "([^"]+)" com motivo "([^"]+)"$/,
  async function (this: NotificationWorld, orderId: string, reason: string) {
    await this.service.handlePaymentFailed({ orderId, reason });
  },
);

When(
  /^chega evento stock.low-stock-alert para a peça "([^"]+)" com estoque (\d+) minimo (\d+)$/,
  async function (
    this: NotificationWorld,
    partId: string,
    current: string,
    min: string,
  ) {
    await this.service.handleLowStockAlert({
      payload: {
        partId,
        sku: `SKU-${partId}`,
        name: `Peça ${partId}`,
        currentStock: Number(current),
        minimumStock: Number(min),
      },
    });
  },
);

Then(
  /^a notificação "([^"]+)" no canal "([^"]+)" é registrada para a ordem "([^"]+)"$/,
  function (
    this: NotificationWorld,
    template: string,
    channel: string,
    orderId: string,
  ) {
    const n = this.repo.byOrder(orderId);
    assert.ok(n, `Nenhuma notificação encontrada para ${orderId}`);
    assert.equal(n.template, template);
    assert.equal(n.channel, channel);
  },
);

Then(
  /^a notificação inclui a variável "([^"]+)" igual a "([^"]+)"$/,
  function (this: NotificationWorld, key: string, value: string) {
    const last = this.repo.rows[this.repo.rows.length - 1];
    const vars = last?.variables as Record<string, unknown> | undefined;
    assert.equal(String(vars?.[key]), value);
  },
);

Then(
  /^a notificação "([^"]+)" no canal "([^"]+)" é registrada com customerCpf "([^"]+)"$/,
  function (
    this: NotificationWorld,
    template: string,
    channel: string,
    cpf: string,
  ) {
    const n = this.repo.byCpf(cpf);
    assert.ok(n, `Nenhuma notificação para customerCpf=${cpf}`);
    assert.equal(n.template, template);
    assert.equal(n.channel, channel);
  },
);
