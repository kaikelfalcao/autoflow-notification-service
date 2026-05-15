import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTemplateDto {
  @ApiPropertyOptional({ required: false })
  subject?: string;

  @ApiPropertyOptional()
  body?: string;

  @ApiPropertyOptional()
  active?: boolean;
}
