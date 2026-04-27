import { Injectable, Logger } from '@nestjs/common';
import { TemplateRepository } from './infra/repositories/template.repository';
import { TemplateRenderer } from '../notification/application/template.renderer';


@Injectable()
export class TemplateService {
    private readonly logger = new Logger(TemplateService.name);
    private readonly renderer = new TemplateRenderer();

    constructor(
        private templateRepository: TemplateRepository,
    ) {}

    async createTemplate(template: any) {
        console.log("this is the template code: ", template.code);
        const existingTemplate = await this.templateRepository.findActiveByCode(template.code);

        console.log(`existingTemplate: ${existingTemplate}`);

        if (existingTemplate) {
            this.logger.error(`Template code already exists: ${template.code}`);
            return;
        }

        const content = this.renderer.render(template.body, template.variables);

        this.logger.log(`Rendered content: ${content}`);

        await this.templateRepository.create({
            code: template.code,
            channel: template.channel,
            body: template.body,
            active: template.active
        });
    }

}