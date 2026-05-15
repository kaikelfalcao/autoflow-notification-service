export interface EventPayload {
  orderId?: string;
  customerCpf?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  [key: string]: unknown;
}

export interface IncomingEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  source: string;
  correlationId: string;
  payload: EventPayload;
}
