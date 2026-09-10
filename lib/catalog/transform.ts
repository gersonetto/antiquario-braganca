import type { CatalogItem, CategorySlug, RaritySlug } from './types';

const CATEGORY_COLUMNS: { index: number; slug: CategorySlug }[] = [
  { index: 2, slug: 'arcana' },
  { index: 3, slug: 'armamentos' },
  { index: 4, slug: 'implementos' },
  { index: 5, slug: 'reliquias' },
  { index: 6, slug: 'consumiveis' },
];

const RD_COLUMNS: { index: number; slug: CategorySlug }[] = [
  { index: 14, slug: 'arcana' },
  { index: 15, slug: 'armamentos' },
  { index: 16, slug: 'implementos' },
  { index: 17, slug: 'reliquias' },
  { index: 18, slug: 'consumiveis' },
];

export function rowToCatalogItem(row: unknown[], rarity: RaritySlug): CatalogItem {
  const categories = CATEGORY_COLUMNS.filter((c) => row[c.index] === true).map(
    (c) => c.slug
  );

  const rd: Partial<Record<CategorySlug, number>> = {};
  for (const category of CATEGORY_COLUMNS) {
    if (row[category.index] === true) {
      const rdColumn = RD_COLUMNS.find(r => r.slug === category.slug)!;
      const value = row[rdColumn.index];
      if (typeof value === 'number') rd[category.slug] = value;
    }
  }

  const modKind = row[11] as string | undefined;
  const modText = (row[12] as string | undefined) || null;
  const modification =
    modKind === 'Simples' || modKind === 'Completa'
      ? {
          kind: (modKind === 'Simples' ? 'simples' : 'completa') as 'simples' | 'completa',
          text: modText,
        }
      : null;

  return {
    id: String(row[0]),
    name: String(row[1]),
    rarity,
    categories,
    priceGp: Number(row[7]),
    attun: row[8] === true,
    type: String(row[9] ?? ''),
    source: (row[10] as string | undefined) || null,
    modification,
    rd,
    // row[13] é o Rating — uso exclusivo do mestre na planilha, nunca sai daqui.
  };
}
