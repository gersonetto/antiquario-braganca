export type RaritySlug = 'comum' | 'incomum' | 'raro' | 'muitoraro' | 'lendario';

export type CategorySlug =
  | 'arcana'
  | 'armamentos'
  | 'implementos'
  | 'reliquias'
  | 'consumiveis';

export interface CatalogItem {
  id: string;
  name: string;
  rarity: RaritySlug;
  categories: CategorySlug[];
  priceGp: number;
  attun: boolean;
  type: string;
  source: string | null;
  modification: { kind: 'simples' | 'completa'; text: string | null } | null;
  rd: Partial<Record<CategorySlug, number>>;
}
