import type { CatalogItem } from '@/lib/catalog/types';

const RARITY_LABEL: Record<CatalogItem['rarity'], string> = {
  comum: 'Comum',
  incomum: 'Incomum',
  raro: 'Raro',
  muitoraro: 'Muito Raro',
  lendario: 'Lendário',
};

const CATEGORY_LABEL: Record<string, string> = {
  arcana: 'Arcana',
  armamentos: 'Armamentos',
  implementos: 'Implementos',
  reliquias: 'Relíquias',
  consumiveis: 'Consumíveis',
};

export function ItemCard({ item }: { item: CatalogItem }) {
  return (
    <article>
      <p>{RARITY_LABEL[item.rarity]}</p>
      <h3>{item.name}</h3>
      <p>{item.categories.map((c) => CATEGORY_LABEL[c]).join(', ')}</p>
      <p>{item.type}{item.attun ? ' · Sintonia' : ''}</p>
      <p>{item.priceGp.toFixed(2)} po</p>
      {item.source && <p>Proveniência: {item.source}</p>}
    </article>
  );
}
