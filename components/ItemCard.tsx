import type { CatalogItem } from '@/lib/catalog/types';
import type { CurrencyMode } from '@/lib/currency/breakIntoCoins';
import { Coins } from './Coins';

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

export function ItemCard({
  item,
  currency,
  onOpenModification,
}: {
  item: CatalogItem;
  currency: CurrencyMode;
  onOpenModification: (item: CatalogItem) => void;
}) {
  return (
    <article
      className="relative flex flex-col gap-2 border p-4"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <span
        className="absolute right-0 top-0 h-0 w-0"
        style={{
          borderStyle: 'solid',
          borderWidth: '0 22px 22px 0',
          borderColor: `transparent var(--rarity-${item.rarity}) transparent transparent`,
        }}
      />

      {item.modification?.kind === 'completa' && (
        <button
          type="button"
          aria-label={`Ver anotação do mestre sobre ${item.name}`}
          onClick={() => onOpenModification(item)}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-xs"
          style={{ background: 'var(--seal)', color: 'var(--surface)' }}
        >
          ✦
        </button>
      )}
      {item.modification?.kind === 'simples' && (
        <span
          title="Atributos ajustados pelo mestre"
          className="absolute right-2 top-2 text-xs"
          style={{ color: 'var(--ink-muted)' }}
        >
          ✦
        </span>
      )}

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

      <div className="mt-auto flex items-end justify-between gap-2 border-t pt-2" style={{ borderColor: 'var(--border)' }}>
        <Coins priceGp={item.priceGp} mode={currency} />
      </div>

      {item.source && (
        <p className="text-right text-xs italic" style={{ color: 'var(--ink-muted)' }}>
          Proveniência: {item.source}
        </p>
      )}
    </article>
  );
}
