import { ApiProperty } from '@nestjs/swagger';

export class TemplateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty({ enum: ['EMAIL', 'SMS', 'WHATSAPP', 'PUSH'] })
  channel: string;

  @ApiProperty({ required: false })
  subject?: string;

  @ApiProperty()
  body: string;

  @ApiProperty()
  active: boolean;
}
