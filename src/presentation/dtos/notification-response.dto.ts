import { ApiProperty } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  eventId: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  customerCpf: string;

  @ApiProperty({ enum: ['EMAIL', 'SMS', 'WHATSAPP', 'PUSH'] })
  channel: string;

  @ApiProperty()
  template: string;

  @ApiProperty({ enum: ['SENT', 'FAILED', 'DELIVERED'] })
  status: string;

  @ApiProperty({ required: false })
  sentAt?: Date;

  @ApiProperty({ required: false })
  deliveredAt?: Date;

  @ApiProperty({ required: false })
  errorMessage?: string;

  @ApiProperty()
  retryCount: number;

  @ApiProperty({ required: false })
  correlationId?: string;
}
