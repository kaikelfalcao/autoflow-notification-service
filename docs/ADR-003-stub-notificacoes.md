# ADR-003 — Stub de canais (LOG/EMAIL/SMS sem envio real)

## Contexto

O MVP do autoflow não tem orçamento ou requisito para integrar com
SendGrid/SES/Twilio. Mas precisamos do contrato pronto para futura extensão
sem refactor do produtor (os outros serviços).

## Decisão

- Notificação tem campo `channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH' | 'LOG'`
- O service grava no Mongo com `status: 'SENT'` sem mandar nada real
- Logger registra: `[EMAIL] template=budget-ready order=o1 vars=...`

Quando integrarmos um provedor real, basta adicionar um adapter por canal
e chamar antes de `repo.create()`. O contrato com produtores não muda.

## Consequências

**+** Producers podem evoluir tipo/template sem esperar implementação real.
**+** Testes e BDD validam roteamento sem dependência externa.
**−** "Funciona" no smoke-test sem realmente enviar — leitor desavisado
pode achar que está mandando email. Mitigado por log explícito e por este
ADR.
