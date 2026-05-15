import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ITemplateRepository } from '../../domain/repositories/template.repository.interface';
import { UpdateTemplateDto } from '../dtos/update-template.dto';
import { TemplateResponseDto } from '../dtos/template-response.dto';

@ApiTags('Templates')
@Controller('templates')
export class TemplateController {
  constructor(private readonly templateRepository: ITemplateRepository) {}

  @Get()
  @ApiOperation({ summary: 'List all notification templates' })
  async findAll(): Promise<TemplateResponseDto[]> {
    return this.templateRepository.findAll() as Promise<TemplateResponseDto[]>;
  }

  @Put(':code')
  @ApiOperation({ summary: 'Update a notification template by code' })
  @ApiParam({ name: 'code', type: String })
  async update(
    @Param('code') code: string,
    @Body() body: UpdateTemplateDto,
  ): Promise<TemplateResponseDto | null> {
    return this.templateRepository.update(
      code,
      body,
    ) as Promise<TemplateResponseDto | null>;
  }
}
