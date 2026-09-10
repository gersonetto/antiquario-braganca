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
      >
        Economia de Bragança
      </button>
      <button type="button" aria-pressed={mode === 'dnd'} onClick={() => onChange('dnd')}>
        Padrão D&amp;D
      </button>
    </div>
  );
}
