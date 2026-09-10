import { describe, it, expect } from 'vitest';
import { validateCatalog, CatalogValidationError } from './validate';
import type { CatalogItem } from './types';

function item(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: 'COM-001',
    name: 'Item Teste',
    rarity: 'comum',
    categories: ['arcana'],
    priceGp: 100,
    attun: false,
    type: 'Wondrous',
    source: null,
    modification: null,
    rd: { arcana: 1 },
    ...overrides,
  };
}

describe('validateCatalog', () => {
  it('não lança erro para um catálogo válido', () => {
    const items = [
      item({ id: 'COM-001', rd: { arcana: 1 } }),
      item({ id: 'COM-002', rd: { arcana: 2 } }),
    ];
    expect(() => validateCatalog(items)).not.toThrow();
  });

  it('lança erro para ID duplicado', () => {
    const items = [item({ id: 'COM-001' }), item({ id: 'COM-001' })];
    expect(() => validateCatalog(items)).toThrow(CatalogValidationError);
  });

  it('lança erro para RD duplicado na mesma raridade e categoria', () => {
    const items = [
      item({ id: 'COM-001', rd: { arcana: 5 } }),
      item({ id: 'COM-002', rd: { arcana: 5 } }),
    ];
    expect(() => validateCatalog(items)).toThrow(CatalogValidationError);
  });

  it('NÃO lança erro para o mesmo RD em categorias diferentes (é escopado por categoria)', () => {
    const items = [
      item({ id: 'COM-001', categories: ['arcana'], rd: { arcana: 5 } }),
      item({ id: 'COM-002', categories: ['armamentos'], rd: { armamentos: 5 } }),
    ];
    expect(() => validateCatalog(items)).not.toThrow();
  });

  it('NÃO lança erro para o mesmo RD na mesma categoria de raridades diferentes', () => {
    const items = [
      item({ id: 'COM-001', rarity: 'comum', rd: { arcana: 5 } }),
      item({ id: 'UNC-001', rarity: 'incomum', rd: { arcana: 5 } }),
    ];
    expect(() => validateCatalog(items)).not.toThrow();
  });

  it('lança erro para priceGp não finito (NaN)', () => {
    const items = [item({ id: 'COM-001', priceGp: NaN })];
    expect(() => validateCatalog(items)).toThrow(CatalogValidationError);
  });
});
