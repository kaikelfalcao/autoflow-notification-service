# autoflow-notification-service

> Microsserviço de **notificações** do ecossistema **autoflow** (FIAP Tech Challenge — Fase 4).

Consome eventos de domínio dos demais microsserviços e persiste uma notificação correspondente no MongoDB (audit log + base para envios futuros — e-mail/push). Não expõe REST além de `/health` — sua interface é puramente assíncrona.

---

## 🧱 Stack

| Camada       | Tecnologia                                |
|--------------|-------------------------------------------|
| Runtime      | Node.js 24 (LTS)                          |
| Linguagem    | TypeScript (strict)                       |
| Framework    | NestJS 11                                 |
| Banco        | MongoDB 7 (Mongoose)                      |
| Mensageria   | RabbitMQ (`@golevelup/nestjs-rabbitmq`)   |
| Observ.      | New Relic APM + canonical logs (Winston)  |
| Testes       | Jest (override de regras em *.spec.ts)    |
| Container    | Docker multi-stage                        |
| Deploy       | EKS via GitHub Actions                    |

---

## 🏛️ Arquitetura

Estrutura **modular simples**:

```
src/
├── modules/
│   └── notification/
│       ├── notification.module.ts
│       ├── notification.service.ts         ← handlers por tipo de evento
│       ├── consumers/                      ← 3 consumers RabbitMQ
│       │   ├── order-events.consumer.ts
│       │   ├── payment-events.consumer.ts
│       │   └── catalog-alerts.consumer.ts
│       └── infra/
│           ├── repositories/               ← MongoNotificationRepository
│           └── schemas/                    ← notification.schema (Mongoose)
├── health/                                 ← /health (status Mongo + service)
└── shared/
    ├── database/                           ← MongoHealth indicator
    ├── logger/, middlewares/, observability/, messaging/
```

---

## 📬 Eventos consumidos

Todos os consumers usam `@RabbitSubscribe` do `@golevelup/nestjs-rabbitmq`. Cada handler persiste uma `Notification` no Mongo com `type`, `orderId`, `payload` e `createdAt`.

### `OrderEventsConsumer` — `order.events` (topic)

| Routing key                  | Handler                       |
|------------------------------|-------------------------------|
| `order.created`              | `handleOrderCreated`          |
| `order.budget.generated`     | `handleBudgetGenerated`       |
| `order.budget.approved`      | `handleBudgetApproved`        |
| `order.payment.requested`    | `handlePaymentRequested`      |
| `order.cancelled`            | `handleOrderCancelled`        |

### `PaymentEventsConsumer` — `payment.events` (topic)

| Routing key            | Handler                       |
|------------------------|-------------------------------|
| `payment.confirmed`    | `handlePaymentConfirmed`      |
| `payment.failed`       | `handlePaymentFailed`         |

### `CatalogAlertsConsumer` — `oficina.alerts` (topic)

| Routing key                  | Handler                       |
|------------------------------|-------------------------------|
| `stock.low-stock-alert`      | `handleLowStockAlert`         |

Em caso de erro no handler, o consumer retorna `Nack(false)` para encaminhar à DLQ (configurada no envelope `@golevelup`). Consumers **nunca relançam exceção**.

---

## 🗄️ Modelo

`Notification` (collection `notifications`):

```typescript
{
  _id: ObjectId,
  type: 'OrderCreated' | 'BudgetGenerated' | 'BudgetApproved'
      | 'PaymentRequested' | 'PaymentConfirmed' | 'PaymentFailed'
      | 'OrderCancelled' | 'LowStockAlert',
  orderId?: string,
  payload: Record<string, unknown>,  // payload original do evento
  correlationId?: string,
  createdAt: Date
}
```

Sem endpoint REST para consulta — é audit log; a leitura é feita diretamente no Mongo ou via dashboard externo.

---

## 🔧 Variáveis de ambiente

| Variável                | Default                                                                | Descrição              |
|-------------------------|------------------------------------------------------------------------|------------------------|
| `PORT`                  | `3005`                                                                 | porta HTTP (health)    |
| `MONGO_URI`             | `mongodb://admin:admin@localhost:27017/notification?authSource=admin`  |                        |
| `RABBITMQ_URL`          | `amqp://admin:admin@localhost:5672`                                    |                        |
| `NEW_RELIC_LICENSE_KEY` | —                                                                      | (opcional) APM         |

---

## 🚀 Rodar localmente

```bash
npm install
docker compose up -d        # Mongo + RMQ
npm run start:dev
```

Integração completa: `cd ../autoflow-infra/local && ./bootstrap.sh`.

---

## 🧪 Testes

```bash
npm run test           # unit
npm run test:cov       # threshold 80% global
npm run lint           # ESLint flat config (eslint.config.mjs)
```

Override de regras em `*.spec.ts` (no `eslint.config.mjs`): `unbound-method`, `require-await`, `no-unsafe-assignment/member-access` desativados — específico para mocks Jest.

> **TODO:** SonarQube Community.

---

## 🐳 Docker / ☸️ Deploy

| Workflow | Trigger                          | Jobs                              |
|----------|----------------------------------|-----------------------------------|
| `ci.yml` | push/PR em qualquer branch       | lint + test:cov                   |
| `cd.yml` | `workflow_run` (CI ok em `main`) | DockerHub + EKS rollout           |

Imagem: `kaikelfalcao/autoflow-notification:<sha>`. Cluster `autoflow-dev-eks` / namespace `autoflow`.

---

## 📊 Observabilidade

- Logs canônicos por evento processado, incluindo `correlationId`, `eventType`, `orderId`.
- Custom events no New Relic: `NotificationPersisted` (1 por evento consumido).
- `MongoHealth` indicator verifica `readyState === 1` no startup.

---

## 🔗 Ecossistema

[`autoflow-infra`](https://github.com/kaikelfalcao/autoflow-infra) · [`autoflow-identity-service`](https://github.com/kaikelfalcao/autoflow-identity-service) · [`autoflow-order-service`](https://github.com/kaikelfalcao/autoflow-order-service) · [`autoflow-catalog-service`](https://github.com/kaikelfalcao/autoflow-catalog-service) · [`autoflow-payment-service`](https://github.com/kaikelfalcao/autoflow-payment-service) · [`autoflow-saga-orchestrator`](https://github.com/kaikelfalcao/autoflow-saga-orchestrator)
