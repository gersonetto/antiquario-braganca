'use client';

import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
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
        animation: 'backdrop-in 0.15s ease-out',
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
          maxWidth: 520,
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: '26px',
          animation: 'modal-in 0.2s ease-out',
        }}
      >
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
        <p style={{ color: 'var(--mod)' }}>Anotação do mestre</p>
        <h2
          id="modal-title"
          style={{ fontFamily: "'Cormorant Garamond', serif", marginBottom: '0.6em' }}
        >
          {item.name}
        </h2>
        <div className="modal-prose">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
              table: (props) => (
                <div className="table-wrap">
                  <table {...props} />
                </div>
              ),
            }}
          >
            {item.modification.text ?? ''}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
