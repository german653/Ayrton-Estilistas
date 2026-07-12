import { slugify } from '../src/common/slugify';

describe('slugify', () => {
  it('convierte nombres de negocio en slugs válidos', () => {
    expect(slugify('Ayrton Estilistas')).toBe('ayrton-estilistas');
  });

  it('elimina acentos y caracteres especiales', () => {
    expect(slugify('Peluquería & Estética Ñuñoa!')).toBe('peluqueria-estetica-nunoa');
  });

  it('recorta guiones al inicio y al final', () => {
    expect(slugify('  -Hola Mundo-  ')).toBe('hola-mundo');
  });
});
