import type { CatalogItem, CategorySlug, RaritySlug } from '@/lib/catalog/types';

export type RandomSource = () => number; // retorna um número em [0, 1)

export type SorteioModo = 'lote' | 'gaveta';

export interface SorteioConfig {
  modo: SorteioModo;
  rarity: RaritySlug;
  category: CategorySlug;
}

export interface SorteioResultSlot {
  item: CatalogItem;
  guaranteedCategory: boolean; // true = o slot é restrito à categoria escolhida
}

export type SorteioResult = SorteioResultSlot[];

export interface RerollOutcome {
  result: SorteioResult;
  changed: boolean; // false quando não havia alternativa no pool
}
