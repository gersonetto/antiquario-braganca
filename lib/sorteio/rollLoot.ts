import type { CatalogItem } from '@/lib/catalog/types';
import { shuffle } from './shuffle';
import type { RandomSource, SorteioConfig, SorteioResult } from './types';

// Este módulo nunca lê o campo `rd` dos itens — o sorteio é 100% aleatório no
// site (Math.random via RandomSource), não depende dos números de dado da planilha.

export function rollLoot(
  items: CatalogItem[],
  config: SorteioConfig,
  rng: RandomSource = Math.random
): SorteioResult {
  const rarityPool = items.filter((i) => i.rarity === config.rarity);

  if (config.modo === 'gaveta') {
    const categoryPool = rarityPool.filter((i) => i.categories.includes(config.category));
    const picked = shuffle(categoryPool, rng).slice(0, 3);
    return picked.map((item) => ({ item, guaranteedCategory: true }));
  }

  // modo 'lote'
  const categoryPool = rarityPool.filter((i) => i.categories.includes(config.category));
  const guaranteed = shuffle(categoryPool, rng).slice(0, Math.min(2, categoryPool.length));
  const guaranteedIds = new Set(guaranteed.map((i) => i.id));

  const remainingPool = rarityPool.filter((i) => !guaranteedIds.has(i.id));
  // Os slots livres compensam quando faltar categoria garantida, até completar 5 no total.
  const freeCount = Math.min(5 - guaranteed.length, remainingPool.length);
  const free = shuffle(remainingPool, rng).slice(0, freeCount);

  return [
    ...guaranteed.map((item) => ({ item, guaranteedCategory: true as const })),
    ...free.map((item) => ({ item, guaranteedCategory: false as const })),
  ];
}
