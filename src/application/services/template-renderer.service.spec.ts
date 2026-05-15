import { TemplateRendererService } from './template-renderer.service';

describe('TemplateRendererService', () => {
  let service: TemplateRendererService;

  beforeEach(() => {
    service = new TemplateRendererService();
  });

  it('should replace a single variable', () => {
    const result = service.render('Olá {name}!', { name: 'João' });
    expect(result).toBe('Olá João!');
  });

  it('should replace multiple variables', () => {
    const result = service.render(
      '{greeting} {name}, seu total é R$ {amount}',
      {
        greeting: 'Olá',
        name: 'Maria',
        amount: '1500.00',
      },
    );
    expect(result).toBe('Olá Maria, seu total é R$ 1500.00');
  });

  it('should replace all occurrences of the same variable', () => {
    const result = service.render('{code} e também {code}', { code: 'ABC' });
    expect(result).toBe('ABC e também ABC');
  });

  it('should leave unknown placeholders intact', () => {
    const result = service.render('Olá {name}, OS {orderId}', { name: 'João' });
    expect(result).toBe('Olá João, OS {orderId}');
  });

  it('should convert non-string values to string', () => {
    const result = service.render('Total: R$ {amount}', { amount: 1500 });
    expect(result).toBe('Total: R$ 1500');
  });

  it('should handle null and undefined values as empty string', () => {
    const result = service.render('{a} e {b}', { a: null, b: undefined });
    expect(result).toBe(' e ');
  });

  it('should return the template unchanged when variables is empty', () => {
    const result = service.render('Sem variáveis', {});
    expect(result).toBe('Sem variáveis');
  });
});
