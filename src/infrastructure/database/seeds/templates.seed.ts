export const templateSeeds = [
  // OS_CREATED
  {
    code: 'OS_CREATED',
    channel: 'PUSH',
    body: 'Sua OS #{orderId} foi registrada. Acompanhe pelo app.',
    active: true,
  },
  {
    code: 'OS_CREATED',
    channel: 'SMS',
    body: 'AutoFlow: OS #{orderId} aberta para o veículo {vehicleModel}. Entraremos em contato em breve.',
    active: true,
  },

  // BUDGET_GENERATED
  {
    code: 'BUDGET_GENERATED',
    channel: 'EMAIL',
    subject: 'Orçamento pronto - OS #{orderId}',
    body: 'Olá {customerName}, o orçamento para seu {vehicleModel} ficou em R$ {totalAmount}. Acesse o app para aprovar ou recusar.',
    active: true,
  },
  {
    code: 'BUDGET_GENERATED',
    channel: 'PUSH',
    body: 'Seu orçamento de R$ {totalAmount} está pronto. Acesse para aprovar.',
    active: true,
  },

  // BUDGET_APPROVED
  {
    code: 'BUDGET_APPROVED',
    channel: 'PUSH',
    body: 'Orçamento aprovado! Seu veículo entra na fila de execução.',
    active: true,
  },

  // BUDGET_REJECTED
  {
    code: 'BUDGET_REJECTED',
    channel: 'EMAIL',
    subject: 'Orçamento recusado - OS #{orderId}',
    body: 'Olá {customerName}, o orçamento da OS #{orderId} foi recusado. Entre em contato para reagendar.',
    active: true,
  },

  // EXECUTION_COMPLETED
  {
    code: 'EXECUTION_COMPLETED',
    channel: 'PUSH',
    body: 'Serviço finalizado! Aguardando pagamento para liberação do veículo.',
    active: true,
  },
  {
    code: 'EXECUTION_COMPLETED',
    channel: 'SMS',
    body: 'AutoFlow: Serviço no seu {vehicleModel} foi concluído. Realize o pagamento para retirar o veículo.',
    active: true,
  },

  // PAYMENT_CREATED
  {
    code: 'PAYMENT_CREATED',
    channel: 'EMAIL',
    subject: 'Link de pagamento - OS #{orderId}',
    body: 'Olá {customerName}, seu serviço foi concluído! Valor: R$ {amount}. Pague aqui: {paymentLink}',
    active: true,
  },
  {
    code: 'PAYMENT_CREATED',
    channel: 'WHATSAPP',
    body: 'AutoFlow: Serviço concluído! Valor: R$ {amount}. Pague aqui: {paymentLink}',
    active: true,
  },

  // PAYMENT_CONFIRMED / PAYMENT_APPROVED
  {
    code: 'PAYMENT_CONFIRMED',
    channel: 'PUSH',
    body: 'Pagamento confirmado! Seu veículo está pronto para retirada.',
    active: true,
  },
  {
    code: 'PAYMENT_APPROVED',
    channel: 'PUSH',
    body: 'Pagamento confirmado! Seu veículo está pronto para retirada.',
    active: true,
  },

  // PAYMENT_FAILED
  {
    code: 'PAYMENT_FAILED',
    channel: 'EMAIL',
    subject: 'Problema no pagamento - OS #{orderId}',
    body: 'Olá {customerName}, houve um problema no seu pagamento. Tente novamente pelo app.',
    active: true,
  },
  {
    code: 'PAYMENT_FAILED',
    channel: 'PUSH',
    body: 'Houve um problema no pagamento. Tente novamente.',
    active: true,
  },

  // OS_CANCELLED
  {
    code: 'OS_CANCELLED',
    channel: 'EMAIL',
    subject: 'OS cancelada - #{orderId}',
    body: 'Olá {customerName}, a OS #{orderId} foi cancelada. Em caso de dúvidas, entre em contato.',
    active: true,
  },
];
