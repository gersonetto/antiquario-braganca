'use client';

import type { CurrencyMode } from '@/lib/currency/breakIntoCoins';

export function CurrencyToggle({
  mode,
  onChange,
}: {
  mode: CurrencyMode;
  onChange: (mode: CurrencyMode) => void;
}) {
  return (
    <div role="group" aria-label="Sistema monetário" style={{ display: 'flex', border: '1px solid var(--border)' }}>
      <button
        type="button"
        aria-pressed={mode === 'braganca'}
        onClick={() => onChange('braganca')}
        className="border px-3 py-1.5 text-sm transition-colors duration-150"
        style={{
          borderColor: 'var(--border)',
          background: mode === 'braganca' ? 'var(--brand)' : 'var(--surface)',
          color: mode === 'braganca' ? 'var(--brand-ink)' : 'var(--ink)',
        }}
      >
        Economia de Bragança
      </button>
      <button
        type="button"
        aria-pressed={mode === 'dnd'}
        onClick={() => onChange('dnd')}
        className="border px-3 py-1.5 text-sm transition-colors duration-150"
        style={{
          borderColor: 'var(--border)',
          background: mode === 'dnd' ? 'var(--brand)' : 'var(--surface)',
          color: mode === 'dnd' ? 'var(--brand-ink)' : 'var(--ink)',
        }}
      >
        Padrão D&amp;D
      </button>
    </div>
  );
}
