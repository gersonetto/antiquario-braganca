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
    <article
      className="relative flex flex-col gap-2 border p-4"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <span
        className="absolute right-0 top-0 h-0 w-0"
        style={{
          borderStyle: 'solid',
          borderWidth: '0 22px 22px 0',
          borderColor: `transparent var(--rarity-${item.rarity}) transparent transparent`,
        }}
      />
      <div className="flex items-baseline justify-between text-xs">
        <span style={{ color: 'var(--ink-muted)' }}>
          {item.categories.map((c) => CATEGORY_LABEL[c]).join(', ')}
        </span>
        <span style={{ color: `var(--rarity-${item.rarity})` }}>
          {RARITY_LABEL[item.rarity]}
        </span>
      </div>
      <h3 className="text-xl" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
        {item.name}
      </h3>
      <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
        {item.type}
        {item.attun ? ' · Sintonia' : ''}
      </p>
      {item.source && (
        <p className="mt-auto text-xs italic" style={{ color: 'var(--ink-muted)' }}>
          Proveniência: {item.source}
        </p>
      )}
    </article>
  );
}
