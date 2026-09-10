'use client';

import type { CatalogItem } from '@/lib/catalog/types';
import type { CurrencyMode } from '@/lib/currency/breakIntoCoins';
import { RARITIES, CATEGORIES } from '@/lib/catalog/options';
import { SORTEIO_MODO_LABELS } from '@/lib/sorteio';
import type { SorteioConfig, SorteioResult } from '@/lib/sorteio';
import { ItemCard } from './ItemCard';

export function SorteioResultView({
  config,
  result,
  currency,
  onReroll,
  onOpenModification,
  onBack,
}: {
  config: SorteioConfig;
  result: SorteioResult;
  currency: CurrencyMode;
  onReroll: (slotIndex: number) => void;
  onOpenModification: (item: CatalogItem) => void;
  onBack: () => void;
}) {
  const modoLabel = SORTEIO_MODO_LABELS[config.modo];
  const rarityLabel = RARITIES.find((r) => r.id === config.rarity)?.label ?? config.rarity;
  const categoryLabel = CATEGORIES.find((c) => c.id === config.category)?.label ?? config.category;
  const expected = modoLabel.count;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '1.4rem' }}
          >
            {modoLabel.title}
          </h2>
          <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            {rarityLabel} · {categoryLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="border px-3 py-1.5 text-sm transition-colors duration-150"
          style={{ borderColor: 'var(--border)', color: 'var(--ink-muted)' }}
        >
          ◀ Nova configuração
        </button>
      </div>

      {result.length < expected && (
        <p className="text-xs italic" style={{ color: 'var(--mod)' }}>
          Só {result.length} {result.length === 1 ? 'relíquia disponível' : 'relíquias disponíveis'}{' '}
          nessa combinação de raridade e temática.
        </p>
      )}

      {result.length === 0 ? (
        <p style={{ color: 'var(--ink-muted)' }}>
          Nenhuma relíquia encontrada para essa raridade e temática.
        </p>
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
        >
          {result.map((slot, index) => (
            <div key={slot.item.id} className="flex flex-col gap-2">
              <ItemCard item={slot.item} currency={currency} onOpenModification={onOpenModification} />
              <div className="flex items-center justify-between gap-2 text-xs">
                {slot.guaranteedCategory ? (
                  <span style={{ color: 'var(--mod)' }}>✦ temática garantida</span>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => onReroll(index)}
                  aria-label={`Sortear novamente no lugar de ${slot.item.name}`}
                  className="seal-hover border px-2 py-1 transition-colors duration-150"
                  style={{ borderColor: 'var(--border)', color: 'var(--ink-muted)' }}
                >
                  ↻ sortear de novo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
