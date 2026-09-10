import type { CatalogItem } from '@/lib/catalog/types';
import { shuffle } from './shuffle';
import type { RandomSource, RerollOutcome, SorteioConfig, SorteioResult } from './types';

export function rerollSlot(
  items: CatalogItem[],
  config: SorteioConfig,
  currentResult: SorteioResult,
  slotIndex: number,
  rng: RandomSource = Math.random
): RerollOutcome {
  if (slotIndex < 0 || slotIndex >= currentResult.length) {
    throw new Error(`slotIndex fora do intervalo: ${slotIndex}`);
  }

  const slot = currentResult[slotIndex];
  const excludeIds = new Set(currentResult.map((s) => s.item.id));

  const basePool = items.filter((i) => i.rarity === config.rarity);
  const candidatePool = (
    slot.guaranteedCategory
      ? basePool.filter((i) => i.categories.includes(config.category))
      : basePool
  ).filter((i) => !excludeIds.has(i.id));

  if (candidatePool.length === 0) {
    return { result: currentResult, changed: false };
  }

  const [newItem] = shuffle(candidatePool, rng);
  const result = currentResult.map((s, i) =>
    i === slotIndex ? { item: newItem, guaranteedCategory: slot.guaranteedCategory } : s
  );
  return { result, changed: true };
}
