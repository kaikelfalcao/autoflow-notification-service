# ADR-001 — Arquitetura minimalista por feature

## Contexto

O notification-service é um consumer RMQ "burro" — recebe evento, formata
mensagem, grava no banco. Não tem regras de negócio complexas (sem
state machine, sem invariantes).

## Decisão

Estrutura mínima por feature, **sem** Hexagonal:

```
src/modules/notification/
├── consumers/     # 3 consumers: order, payment, catalog-alerts
├── infra/         # schema Mongoose + repository
├── notification.service.ts
└── notification.module.ts
```

Cada consumer `@RabbitSubscribe` apenas delega ao `NotificationService`
com handler dedicado por tipo de evento.

## Consequências

**+** Quase nada para aprender — um consumer chama o service, fim.
**+** Adicionar um novo tipo de notificação é um método novo no service
+ um consumer novo. Sem ports/adapters.
**−** Se a lógica crescer (templating, fallback de canal, retry com
backoff), pode justificar refactor para Hexagonal. Não vale hoje.
