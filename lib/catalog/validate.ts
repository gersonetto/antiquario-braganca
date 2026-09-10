import type { CatalogItem } from './types';

export class CatalogValidationError extends Error {}

export function validateCatalog(items: CatalogItem[]): void {
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.id)) {
      throw new CatalogValidationError(`ID duplicado: ${item.id}`);
    }
    ids.add(item.id);
  }

  const rdSeen = new Map<string, string>();
  for (const item of items) {
    for (const [category, rd] of Object.entries(item.rd)) {
      const key = `${item.rarity}|${category}|${rd}`;
      const existing = rdSeen.get(key);
      if (existing) {
        throw new CatalogValidationError(
          `RD duplicado: ${item.rarity}/${category}/RD=${rd} usado por "${existing}" e "${item.name}"`
        );
      }
      rdSeen.set(key, item.name);
    }
  }
}
