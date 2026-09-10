'use client';

import { useEffect } from 'react';
import type { CatalogItem } from '@/lib/catalog/types';

export function ModificationModal({
  item,
  onClose,
}: {
  item: CatalogItem;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!item.modification || item.modification.kind !== 'completa') return null;

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
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--gold)',
          maxWidth: 420,
          width: '100%',
          padding: '26px',
        }}
      >
        <button type="button" onClick={onClose} aria-label="Fechar">
          Fechar ✕
        </button>
        <p style={{ color: 'var(--seal)' }}>Anotação do mestre</p>
        <h2 id="modal-title" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          {item.name}
        </h2>
        <p style={{ fontFamily: "'Cormorant Garamond', serif" }}>{item.modification.text}</p>
      </div>
    </div>
  );
}
