'use client';

import { useMemo, useState } from 'react';
import type { CatalogItem, RaritySlug, CategorySlug } from '@/lib/catalog/types';
import { ItemCard } from './ItemCard';
import { ModificationModal } from './ModificationModal';

const RARITIES: { id: RaritySlug; label: string }[] = [
  { id: 'comum', label: 'Comum' },
  { id: 'incomum', label: 'Incomum' },
  { id: 'raro', label: 'Raro' },
  { id: 'muitoraro', label: 'Muito Raro' },
  { id: 'lendario', label: 'Lendário' },
];

const CATEGORIES: { id: CategorySlug; label: string }[] = [
  { id: 'arcana', label: 'Arcana' },
  { id: 'armamentos', label: 'Armamentos' },
  { id: 'implementos', label: 'Implementos' },
  { id: 'reliquias', label: 'Relíquias' },
  { id: 'consumiveis', label: 'Consumíveis' },
];

export function CatalogExplorer({ items }: { items: CatalogItem[] }) {
  const [search, setSearch] = useState('');
  const [rarities, setRarities] = useState<Set<RaritySlug>>(new Set());
  const [categories, setCategories] = useState<Set<CategorySlug>>(new Set());
  const [modalItem, setModalItem] = useState<CatalogItem | null>(null);

  function toggle<T>(set: Set<T>, value: T, setSet: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setSet(next);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (q && !item.name.toLowerCase().includes(q)) return false;
      if (rarities.size && !rarities.has(item.rarity)) return false;
      if (categories.size && !item.categories.some((c) => categories.has(c))) return false;
      return true;
    });
  }, [items, search, rarities, categories]);

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16" style={{ color: 'var(--ink)' }}>
      <div
        className="mb-6 flex flex-wrap items-center gap-4 border-b py-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <label
          className="flex min-w-[200px] flex-1 items-center gap-2 border px-3 py-2"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <input
            type="text"
            placeholder="Buscar por nome do item…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>

        <div role="group" aria-label="Raridade" className="flex flex-wrap gap-2">
          {RARITIES.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={rarities.has(r.id)}
              onClick={() => toggle(rarities, r.id, setRarities)}
              className="border px-3 py-1.5 text-sm"
              style={{
                borderColor: 'var(--border)',
                background: rarities.has(r.id) ? `var(--rarity-${r.id})` : 'var(--surface)',
                color: rarities.has(r.id) ? 'var(--surface)' : 'var(--ink)',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[168px_1fr] gap-8">
        <nav aria-label="Categorias" className="flex flex-col gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={categories.has(c.id)}
              onClick={() => toggle(categories, c.id, setCategories)}
              className="border-l-2 px-3 py-2 text-left text-xs"
              style={{
                borderColor: categories.has(c.id) ? 'var(--gold)' : 'transparent',
                background: categories.has(c.id) ? 'var(--surface)' : 'transparent',
                color: categories.has(c.id) ? 'var(--ink)' : 'var(--ink-muted)',
              }}
            >
              {c.label}
            </button>
          ))}
        </nav>

        <section
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(228px, 1fr))' }}
        >
          {filtered.length === 0 && (
            <p style={{ color: 'var(--ink-muted)' }}>
              Nenhuma relíquia encontrada com esses filtros.
            </p>
          )}
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} onOpenModification={setModalItem} />
          ))}
        </section>
      </div>

      {modalItem && <ModificationModal item={modalItem} onClose={() => setModalItem(null)} />}
    </main>
  );
}
