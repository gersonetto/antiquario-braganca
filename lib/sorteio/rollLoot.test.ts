import { describe, it, expect } from 'vitest';
import { rollLoot } from './rollLoot';
import type { CatalogItem } from '@/lib/catalog/types';

function item(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: 'ID',
    name: 'Item',
    rarity: 'raro',
    categories: ['arcana'],
    priceGp: 100,
    attun: false,
    type: 'Wondrous',
    source: null,
    modification: null,
    rd: {},
    ...overrides,
  };
}

// Pool amplo: 10 itens raros, 4 deles em "arcana" (a categoria que vamos escolher).
function widePool(): CatalogItem[] {
  const arcana = ['A1', 'A2', 'A3', 'A4'].map((id) =>
    item({ id, name: id, categories: ['arcana'] })
  );
  const outras = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'].map((id) =>
    item({ id, name: id, categories: ['armamentos'] })
  );
  return [...arcana, ...outras];
}

describe('rollLoot — modo "gaveta" (3 itens, raridade+categoria fixas)', () => {
  it('sorteia 3 itens da raridade e categoria escolhidas, sem repetir', () => {
    const items = widePool();
    const result = rollLoot(items, { modo: 'gaveta', rarity: 'raro', category: 'arcana' });
    expect(result).toHaveLength(3);
    const ids = result.map((s) => s.item.id);
    expect(new Set(ids).size).toBe(3);
    for (const slot of result) {
      expect(slot.item.rarity).toBe('raro');
      expect(slot.item.categories).toContain('arcana');
      expect(slot.guaranteedCategory).toBe(true);
    }
  });

  it('com pool menor que 3, retorna só o que existe, sem duplicar', () => {
    const items = [
      item({ id: 'A1', categories: ['arcana'] }),
      item({ id: 'A2', categories: ['arcana'] }),
    ];
    const result = rollLoot(items, { modo: 'gaveta', rarity: 'raro', category: 'arcana' });
    expect(result).toHaveLength(2);
    expect(new Set(result.map((s) => s.item.id)).size).toBe(2);
  });

  it('com pool vazio, retorna array vazio sem lançar erro', () => {
    const result = rollLoot([], { modo: 'gaveta', rarity: 'raro', category: 'arcana' });
    expect(result).toEqual([]);
  });

  it('com rng fixo, o resultado é reproduzível', () => {
    const items = widePool();
    const config = { modo: 'gaveta' as const, rarity: 'raro' as const, category: 'arcana' as const };
    const r1 = rollLoot(items, config, () => 0.1);
    const r2 = rollLoot(items, config, () => 0.1);
    expect(r1.map((s) => s.item.id)).toEqual(r2.map((s) => s.item.id));
  });
});

describe('rollLoot — modo "lote" (5 itens, 2 garantidos da categoria + 3 livres)', () => {
  it('retorna 5 itens, 2 garantidos da categoria escolhida, sem ids duplicados', () => {
    const items = widePool();
    const result = rollLoot(items, { modo: 'lote', rarity: 'raro', category: 'arcana' });
    expect(result).toHaveLength(5);
    const ids = result.map((s) => s.item.id);
    expect(new Set(ids).size).toBe(5);

    const guaranteed = result.filter((s) => s.guaranteedCategory);
    expect(guaranteed).toHaveLength(2);
    for (const slot of guaranteed) {
      expect(slot.item.categories).toContain('arcana');
    }
  });

  it('todos os 5 itens são da raridade escolhida; os 3 livres podem ser de qualquer categoria', () => {
    const items = widePool();
    const result = rollLoot(items, { modo: 'lote', rarity: 'raro', category: 'arcana' });
    for (const slot of result) {
      expect(slot.item.rarity).toBe('raro');
    }
  });

  it('slots livres não filtram categoria: com rng que sempre escolhe o primeiro do pool restante, um item de arcana pode cair num slot livre', () => {
    // Pool onde, após os 2 garantidos saírem, o restante começa com itens de arcana
    // ainda disponíveis (garantindo que "livre" de fato não filtra categoria).
    const items = [
      item({ id: 'A1', categories: ['arcana'] }),
      item({ id: 'A2', categories: ['arcana'] }),
      item({ id: 'A3', categories: ['arcana'] }), // sobra depois dos 2 garantidos
      item({ id: 'B1', categories: ['armamentos'] }),
      item({ id: 'B2', categories: ['armamentos'] }),
    ];
    // rng sempre 0: shuffle com rng=0 é uma rotação determinística (ver shuffle.test.ts),
    // suficiente aqui só para confirmar que A3 (arcana) pode aparecer entre os livres.
    const result = rollLoot(
      items,
      { modo: 'lote', rarity: 'raro', category: 'arcana' },
      () => 0
    );
    expect(result).toHaveLength(5);
    const freeSlots = result.filter((s) => !s.guaranteedCategory);
    const freeHasArcana = freeSlots.some((s) => s.item.categories.includes('arcana'));
    expect(freeHasArcana).toBe(true);
  });

  it('categoryPool com 1 item: só 1 slot garantido, os outros 4 vêm do pool livre', () => {
    const items = [
      item({ id: 'A1', categories: ['arcana'] }),
      item({ id: 'B1', categories: ['armamentos'] }),
      item({ id: 'B2', categories: ['armamentos'] }),
      item({ id: 'B3', categories: ['armamentos'] }),
      item({ id: 'B4', categories: ['armamentos'] }),
    ];
    const result = rollLoot(items, { modo: 'lote', rarity: 'raro', category: 'arcana' });
    expect(result).toHaveLength(5);
    expect(result.filter((s) => s.guaranteedCategory)).toHaveLength(1);
  });

  it('categoryPool vazio: 0 slots garantidos, os 5 vêm do pool livre', () => {
    const items = [
      item({ id: 'B1', categories: ['armamentos'] }),
      item({ id: 'B2', categories: ['armamentos'] }),
      item({ id: 'B3', categories: ['armamentos'] }),
      item({ id: 'B4', categories: ['armamentos'] }),
      item({ id: 'B5', categories: ['armamentos'] }),
    ];
    const result = rollLoot(items, { modo: 'lote', rarity: 'raro', category: 'arcana' });
    expect(result).toHaveLength(5);
    expect(result.filter((s) => s.guaranteedCategory)).toHaveLength(0);
  });

  it('rarityPool menor que 5: retorna só o que existe, sem duplicar', () => {
    const items = [
      item({ id: 'A1', categories: ['arcana'] }),
      item({ id: 'B1', categories: ['armamentos'] }),
      item({ id: 'B2', categories: ['armamentos'] }),
    ];
    const result = rollLoot(items, { modo: 'lote', rarity: 'raro', category: 'arcana' });
    expect(result).toHaveLength(3);
    expect(new Set(result.map((s) => s.item.id)).size).toBe(3);
  });

  it('rarityPool vazio: retorna array vazio', () => {
    const result = rollLoot([], { modo: 'lote', rarity: 'raro', category: 'arcana' });
    expect(result).toEqual([]);
  });

  it('nunca inclui item de outra raridade', () => {
    const items = [
      ...widePool(),
      item({ id: 'C1', rarity: 'lendario', categories: ['arcana'] }),
    ];
    const result = rollLoot(items, { modo: 'lote', rarity: 'raro', category: 'arcana' });
    expect(result.every((s) => s.item.rarity === 'raro')).toBe(true);
  });
});
