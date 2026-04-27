export class TemplateRenderer {
  render(template: string, variables: Record<string, any>): string {
    let result = template;

    for (const key in variables) {
      const value = variables[key];

      const regex = new RegExp(`{${key}}`, 'g');

      result = result.replace(regex, String(value));
    }

    return result;
  }
}