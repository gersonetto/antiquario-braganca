import { describe, it, expect } from 'vitest';
import { rerollSlot } from './rerollSlot';
import type { CatalogItem } from '@/lib/catalog/types';
import type { SorteioResult } from './types';

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

const config = { modo: 'lote' as const, rarity: 'raro' as const, category: 'arcana' as const };

function widePool(): CatalogItem[] {
  const arcana = ['A1', 'A2', 'A3', 'A4'].map((id) => item({ id, categories: ['arcana'] }));
  const outras = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'].map((id) =>
    item({ id, categories: ['armamentos'] })
  );
  return [...arcana, ...outras];
}

describe('rerollSlot', () => {
  it('troca só o slot pedido, mantendo os outros com o mesmo id', () => {
    const items = widePool();
    const current: SorteioResult = [
      { item: items[0], guaranteedCategory: true }, // A1
      { item: items[1], guaranteedCategory: true }, // A2
      { item: items[4], guaranteedCategory: false }, // B1
      { item: items[5], guaranteedCategory: false }, // B2
      { item: items[6], guaranteedCategory: false }, // B3
    ];
    const outcome = rerollSlot(items, config, current, 2);
    expect(outcome.changed).toBe(true);
    expect(outcome.result[0].item.id).toBe('A1');
    expect(outcome.result[1].item.id).toBe('A2');
    expect(outcome.result[3].item.id).toBe('B2');
    expect(outcome.result[4].item.id).toBe('B3');
    expect(outcome.result[2].item.id).not.toBe('B1');
  });

  it('o novo item sorteado nunca colide com os ids dos outros slots atuais', () => {
    const items = widePool();
    const current: SorteioResult = [
      { item: items[0], guaranteedCategory: true },
      { item: items[1], guaranteedCategory: true },
      { item: items[4], guaranteedCategory: false },
      { item: items[5], guaranteedCategory: false },
      { item: items[6], guaranteedCategory: false },
    ];
    const outcome = rerollSlot(items, config, current, 2);
    const otherIds = [
      outcome.result[0].item.id,
      outcome.result[1].item.id,
      outcome.result[3].item.id,
      outcome.result[4].item.id,
    ];
    expect(otherIds).not.toContain(outcome.result[2].item.id);
  });

  it('reroll de slot garantido só sorteia dentro da categoria, e mantém a flag true', () => {
    const items = widePool();
    const current: SorteioResult = [
      { item: items[0], guaranteedCategory: true }, // A1
      { item: items[1], guaranteedCategory: true }, // A2
      { item: items[4], guaranteedCategory: false },
      { item: items[5], guaranteedCategory: false },
      { item: items[6], guaranteedCategory: false },
    ];
    const outcome = rerollSlot(items, config, current, 0);
    expect(outcome.changed).toBe(true);
    expect(outcome.result[0].guaranteedCategory).toBe(true);
    expect(outcome.result[0].item.categories).toContain('arcana');
  });

  it('reroll de slot livre sorteia de toda a raridade, e mantém a flag false', () => {
    const items = widePool();
    const current: SorteioResult = [
      { item: items[0], guaranteedCategory: true },
      { item: items[1], guaranteedCategory: true },
      { item: items[4], guaranteedCategory: false }, // B1
      { item: items[5], guaranteedCategory: false }, // B2
      { item: items[6], guaranteedCategory: false }, // B3
    ];
    const outcome = rerollSlot(items, config, current, 2);
    expect(outcome.result[2].guaranteedCategory).toBe(false);
    expect(outcome.result[2].item.rarity).toBe('raro');
  });

  it('sem itens elegíveis fora da mão atual, retorna changed:false e o mesmo resultado', () => {
    // categoria com só os 2 já sorteados -> reroll de um slot garantido não tem pra onde ir
    const items = [
      item({ id: 'A1', categories: ['arcana'] }),
      item({ id: 'A2', categories: ['arcana'] }),
    ];
    const current: SorteioResult = [
      { item: items[0], guaranteedCategory: true },
      { item: items[1], guaranteedCategory: true },
    ];
    const outcome = rerollSlot(items, config, current, 0);
    expect(outcome.changed).toBe(false);
    expect(outcome.result).toEqual(current);
  });

  it('slotIndex inválido lança erro', () => {
    const items = widePool();
    const current: SorteioResult = [{ item: items[0], guaranteedCategory: true }];
    expect(() => rerollSlot(items, config, current, -1)).toThrow();
    expect(() => rerollSlot(items, config, current, 1)).toThrow();
  });

  it('funciona igual para o modo "gaveta" (mão de 3)', () => {
    const items = widePool();
    const gavetaConfig = { modo: 'gaveta' as const, rarity: 'raro' as const, category: 'arcana' as const };
    const current: SorteioResult = [
      { item: items[0], guaranteedCategory: true },
      { item: items[1], guaranteedCategory: true },
      { item: items[2], guaranteedCategory: true },
    ];
    const outcome = rerollSlot(items, gavetaConfig, current, 1);
    expect(outcome.changed).toBe(true);
    expect(outcome.result[1].item.categories).toContain('arcana');
    expect(outcome.result[1].guaranteedCategory).toBe(true);
  });
});
