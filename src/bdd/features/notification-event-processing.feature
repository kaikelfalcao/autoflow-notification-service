Feature: Notification event processing
  As the notification service
  In order to keep customers informed about their service orders
  I want to process incoming business events and dispatch notifications on the correct channels

  Scenario: Budget generated event triggers multi-channel notifications
    Given active templates exist for "BUDGET_GENERATED" on channels "EMAIL" and "PUSH"
    And no notification has been sent for event "evt-budget-001" on any channel
    When the "BUDGET_GENERATED" event is processed for customer "joao@test.com"
    Then a notification should be persisted as PENDING for the EMAIL channel
    And a notification should be persisted as PENDING for the PUSH channel
    And the email adapter should be called with recipient "joao@test.com"
    And both notifications should be updated to SENT status

  Scenario: Duplicate event on the same channel is silently ignored
    Given active templates exist for "BUDGET_GENERATED" on channels "EMAIL" and "PUSH"
    And a notification already exists for event "evt-dup-001" on channel "EMAIL"
    When the "BUDGET_GENERATED" event is processed again with event ID "evt-dup-001"
    Then no new notification should be created for the EMAIL channel
    And the email adapter should not be called for the EMAIL channel

  Scenario: Event without a matching template is silently ignored
    Given no templates exist for event type "UNKNOWN_EVENT"
    When the "UNKNOWN_EVENT" event is processed
    Then no notification should be created at all
