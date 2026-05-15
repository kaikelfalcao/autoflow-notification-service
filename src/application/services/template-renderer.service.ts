import { Injectable } from '@nestjs/common';

@Injectable()
export class TemplateRendererService {
  render(template: string, variables: Record<string, unknown>): string {
    return Object.entries(variables).reduce((result, [key, value]) => {
      return result.replace(
        new RegExp(String.raw`\{${key}\}`, 'g'),
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        String(value ?? ''),
      );
    }, template);
  }
}
