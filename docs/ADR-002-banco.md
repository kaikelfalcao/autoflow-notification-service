# ADR-002 — MongoDB para histórico de notificações

## Contexto

Notificações têm:
- `template` e `channel` que crescem (novos templates aparecem sempre)
- `variables: Mixed` — payload arbitrário por template
- Acesso por `orderId` ou `customerCpf` (queries chave-valor simples)
- Sem relacionamentos com outras entidades

## Decisão

- **MongoDB 7** com Mongoose
- Schema simples: `{ orderId, customerCpf, channel, template, variables, status, sentAt, retryCount }`
- Índices em `orderId` e `customerCpf` para consultas frequentes
- Não usamos transactions — nada cross-document

## Consequências

**+** Schema evolutivo sem migrations toda vez que adicionarmos template.
**+** `variables: Mixed` aceita qualquer shape de payload.
**+** Cumpre requisito do challenge de usar NoSQL com justificativa.
**−** Sem integridade referencial com `order` — se uma order é deletada,
notificações ficam orfãs. Aceitável (histórico imutável).
