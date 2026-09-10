'use client';

import { RARITIES, CATEGORIES } from '@/lib/catalog/options';
import { SORTEIO_MODO_LABELS } from '@/lib/sorteio';
import type { SorteioConfig } from '@/lib/sorteio';

export function SorteioConfigForm({
  config,
  onChange,
  onSubmit,
}: {
  config: SorteioConfig;
  onChange: (config: SorteioConfig) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-xs" style={{ color: 'var(--ink-muted)' }}>
          Modalidade
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(Object.keys(SORTEIO_MODO_LABELS) as (keyof typeof SORTEIO_MODO_LABELS)[]).map(
            (modo) => {
              const label = SORTEIO_MODO_LABELS[modo];
              const active = config.modo === modo;
              return (
                <button
                  key={modo}
                  type="button"
                  onClick={() => onChange({ ...config, modo })}
                  className="border p-3 text-left transition-colors duration-150"
                  style={{
                    borderColor: active ? 'var(--gold)' : 'var(--border)',
                    background: active ? 'var(--surface)' : 'transparent',
                  }}
                >
                  <p
                    className="text-base"
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
                  >
                    {label.title}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>
                    {label.description}
                  </p>
                </button>
              );
            }
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs" style={{ color: 'var(--ink-muted)' }}>
          Raridade
        </p>
        <div role="radiogroup" aria-label="Raridade" className="flex flex-wrap gap-2">
          {RARITIES.map((r) => (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={config.rarity === r.id}
              onClick={() => onChange({ ...config, rarity: r.id })}
              className="border px-3 py-1.5 text-sm transition-colors duration-150"
              style={{
                borderColor: 'var(--border)',
                background: config.rarity === r.id ? `var(--rarity-${r.id})` : 'var(--surface)',
                color: config.rarity === r.id ? 'var(--surface)' : 'var(--ink)',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs" style={{ color: 'var(--ink-muted)' }}>
          Temática
        </p>
        <div role="radiogroup" aria-label="Categoria" className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={config.category === c.id}
              onClick={() => onChange({ ...config, category: c.id })}
              className="border px-3 py-1.5 text-sm transition-colors duration-150"
              style={{
                borderColor: config.category === c.id ? 'var(--gold)' : 'var(--border)',
                background: config.category === c.id ? 'var(--surface)' : 'transparent',
                color: config.category === c.id ? 'var(--ink)' : 'var(--ink-muted)',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        className="self-start border px-5 py-2 text-sm font-medium transition-colors duration-150"
        style={{
          fontFamily: "'Cinzel', serif",
          background: 'var(--brand)',
          color: 'var(--brand-ink)',
          borderColor: 'var(--gold)',
        }}
      >
        Sortear
      </button>
    </div>
  );
}
