'use client';

import { useEffect, useState } from 'react';
import type { CatalogItem } from '@/lib/catalog/types';
import type { CurrencyMode } from '@/lib/currency/breakIntoCoins';
import { rollLoot, rerollSlot } from '@/lib/sorteio';
import type { SorteioConfig, SorteioResult } from '@/lib/sorteio';
import { SorteioConfigForm } from './SorteioConfigForm';
import { SorteioResultView } from './SorteioResultView';
import { ModificationModal } from './ModificationModal';

const DEFAULT_CONFIG: SorteioConfig = { modo: 'lote', rarity: 'comum', category: 'arcana' };

export function SorteioModal({
  items,
  currency,
  onClose,
}: {
  items: CatalogItem[];
  currency: CurrencyMode;
  onClose: () => void;
}) {
  const [step, setStep] = useState<'config' | 'result'>('config');
  const [config, setConfig] = useState<SorteioConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<SorteioResult>([]);
  const [modalItem, setModalItem] = useState<CatalogItem | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Enquanto o jogador olha a anotação de um item sorteado, ela substitui o
  // conteúdo do Sorteio (um único overlay visível por vez); ao fechar, o estado
  // de config/resultado já está preservado e a casca do Sorteio reaparece.
  if (modalItem) {
    return <ModificationModal item={modalItem} onClose={() => setModalItem(null)} />;
  }

  function handleSubmit() {
    setResult(rollLoot(items, config));
    setStep('result');
  }

  function handleReroll(slotIndex: number) {
    setResult((current) => rerollSlot(items, config, current, slotIndex).result);
  }

  function handleBack() {
    setStep('config');
    setResult([]);
  }

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17,12,6,.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 10,
        animation: 'backdrop-in 0.15s ease-out',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sorteio-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--gold)',
          maxWidth: 860,
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '26px',
          animation: 'modal-in 0.2s ease-out',
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h1
            id="sorteio-title"
            style={{ fontFamily: "'Cinzel', serif", fontSize: '1.1rem', letterSpacing: '0.03em' }}
          >
            Sorteio do Relicário
          </h1>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="seal-hover"
            style={{
              color: 'var(--ink-muted)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: 'none',
              border: 'none',
            }}
          >
            Fechar ✕
          </button>
        </div>

        {step === 'config' ? (
          <SorteioConfigForm config={config} onChange={setConfig} onSubmit={handleSubmit} />
        ) : (
          <SorteioResultView
            config={config}
            result={result}
            currency={currency}
            onReroll={handleReroll}
            onOpenModification={setModalItem}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}
