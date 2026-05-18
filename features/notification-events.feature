Feature: Notificações por eventos
  Como notification-service
  Quero consumir eventos de order, payment e catalog
  Para gravar notificações no histórico do cliente

  Scenario: Notifica criação de ordem
    When chega evento order.created para a ordem "o1" do cliente "Maria" cpf "12345678900"
    Then a notificação "order-created" no canal "LOG" é registrada para a ordem "o1"

  Scenario: Notifica orçamento gerado
    When chega evento order.budget.generated para a ordem "o2" com total 25000 centavos
    Then a notificação "budget-ready" no canal "EMAIL" é registrada para a ordem "o2"

  Scenario: Notifica pagamento confirmado
    When chega evento payment.confirmed para a ordem "o3"
    Then a notificação "payment-confirmed" no canal "EMAIL" é registrada para a ordem "o3"

  Scenario: Notifica pagamento rejeitado com motivo
    When chega evento payment.failed para a ordem "o4" com motivo "card_declined"
    Then a notificação "payment-failed" no canal "EMAIL" é registrada para a ordem "o4"
    And a notificação inclui a variável "reason" igual a "card_declined"

  Scenario: Notifica alerta de estoque baixo para o admin
    When chega evento stock.low-stock-alert para a peça "p1" com estoque 2 minimo 5
    Then a notificação "low-stock-alert" no canal "EMAIL" é registrada com customerCpf "ADMIN"
