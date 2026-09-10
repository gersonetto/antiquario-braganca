import { describe, it, expect } from 'vitest';
import { rowToCatalogItem } from './transform';

// Layout de coluna (índice 0-based, planilha A2:S...):
// 0 ID, 1 Name, 2-6 categorias (Arcana..Consumíveis), 7 Price, 8 Attun,
// 9 Type, 10 Source, 11 Tipo de modificação, 12 Texto da modificação,
// 13 Rating, 14-18 RD por categoria (Arcana..Consumíveis)
function baseRow(overrides: Record<number, unknown> = {}): unknown[] {
  const row: unknown[] = [
    'COM-001', 'Bottle of Boundless Coffee',
    true, true, true, true, false,
    199.53,
    false,
    'Wondrous', 'SCC 38',
    'Original', '',
    10,
    1, 3, 2, 1, undefined,
  ];
  for (const [i, v] of Object.entries(overrides)) row[Number(i)] = v;
  return row;
}

describe('rowToCatalogItem', () => {
  it('converte campos básicos corretamente', () => {
    const item = rowToCatalogItem(baseRow(), 'comum');
    expect(item.id).toBe('COM-001');
    expect(item.name).toBe('Bottle of Boundless Coffee');
    expect(item.rarity).toBe('comum');
    expect(item.priceGp).toBe(199.53);
    expect(item.attun).toBe(false);
    expect(item.type).toBe('Wondrous');
    expect(item.source).toBe('SCC 38');
  });

  it('lê as categorias marcadas como true, ignorando as false', () => {
    const item = rowToCatalogItem(baseRow(), 'comum');
    expect(item.categories).toEqual(['arcana', 'armamentos', 'implementos', 'reliquias']);
  });

  it('inclui RD só das categorias marcadas', () => {
    const item = rowToCatalogItem(baseRow(), 'comum');
    expect(item.rd).toEqual({ arcana: 1, armamentos: 3, implementos: 2, reliquias: 1 });
  });

  it('nunca inclui o Rating no item retornado', () => {
    const item = rowToCatalogItem(baseRow(), 'comum');
    expect('rating' in item).toBe(false);
  });

  it('modification é null quando Tipo de modificação é Original', () => {
    const item = rowToCatalogItem(baseRow(), 'comum');
    expect(item.modification).toBeNull();
  });

  it('monta modification "completa" com o texto do mestre', () => {
    const row = baseRow({ 11: 'Completa', 12: 'Texto de exemplo do mestre.' });
    const item = rowToCatalogItem(row, 'comum');
    expect(item.modification).toEqual({ kind: 'completa', text: 'Texto de exemplo do mestre.' });
  });

  it('monta modification "simples" sem exigir texto', () => {
    const row = baseRow({ 11: 'Simples', 12: '' });
    const item = rowToCatalogItem(row, 'comum');
    expect(item.modification).toEqual({ kind: 'simples', text: null });
  });

  it('source vazio vira null, não string vazia', () => {
    const row = baseRow({ 10: '' });
    const item = rowToCatalogItem(row, 'comum');
    expect(item.source).toBeNull();
  });
});
