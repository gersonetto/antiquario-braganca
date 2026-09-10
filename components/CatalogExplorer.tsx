'use client';

import { useMemo, useState } from 'react';
import type { CatalogItem, RaritySlug, CategorySlug } from '@/lib/catalog/types';
import type { CurrencyMode } from '@/lib/currency/breakIntoCoins';
import { RARITIES, CATEGORIES } from '@/lib/catalog/options';
import { ItemCard } from './ItemCard';
import { ModificationModal } from './ModificationModal';
import { CurrencyToggle } from './CurrencyToggle';
import { SorteioButton } from './SorteioButton';
import { SorteioModal } from './SorteioModal';

export function CatalogExplorer({ items }: { items: CatalogItem[] }) {
  const [search, setSearch] = useState('');
  const [rarities, setRarities] = useState<Set<RaritySlug>>(new Set());
  const [categories, setCategories] = useState<Set<CategorySlug>>(new Set());
  const [currency, setCurrency] = useState<CurrencyMode>('braganca');
  const [modalItem, setModalItem] = useState<CatalogItem | null>(null);
  const [sorteioOpen, setSorteioOpen] = useState(false);

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

  // Contagem por categoria considerando busca e raridade (mas não a própria seleção
  // de categoria), pra mostrar "quantos itens teria se eu marcasse essa categoria".
  const categoryCounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const counts: Record<CategorySlug, number> = {
      arcana: 0,
      armamentos: 0,
      implementos: 0,
      reliquias: 0,
      consumiveis: 0,
    };
    for (const item of items) {
      if (q && !item.name.toLowerCase().includes(q)) continue;
      if (rarities.size && !rarities.has(item.rarity)) continue;
      for (const c of item.categories) counts[c]++;
    }
    return counts;
  }, [items, search, rarities]);

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16" style={{ color: 'var(--ink)' }}>
      <div
        className="mb-6 flex flex-wrap items-center gap-4 border-b py-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <label
          className="flex min-w-[200px] flex-1 items-center gap-2 border px-3 py-2 transition-colors duration-150"
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
              className="border px-3 py-1.5 text-sm transition-colors duration-150"
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

        <CurrencyToggle mode={currency} onChange={setCurrency} />

        <SorteioButton onClick={() => setSorteioOpen(true)} />
      </div>

      <div className="grid grid-cols-[168px_1fr] gap-8">
        <nav aria-label="Categorias" className="flex flex-col gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={categories.has(c.id)}
              onClick={() => toggle(categories, c.id, setCategories)}
              className="flex items-center justify-between gap-2 border-l-2 px-3 py-2 text-left text-xs transition-colors duration-150"
              style={{
                fontFamily: "'Cinzel', serif",
                borderColor: categories.has(c.id) ? 'var(--gold)' : 'transparent',
                background: categories.has(c.id) ? 'var(--surface)' : 'transparent',
                color: categories.has(c.id) ? 'var(--ink)' : 'var(--ink-muted)',
              }}
            >
              <span>{c.label}</span>
              <span
                className="font-sans"
                style={{ color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}
              >
                {categoryCounts[c.id]}
              </span>
            </button>
          ))}
        </nav>

        <div className="flex flex-col gap-4">
          <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            {filtered.length} {filtered.length === 1 ? 'item encontrado' : 'itens encontrados'}
          </p>

          <section
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(228px, 1fr))' }}
          >
            {filtered.length === 0 && (
              <p style={{ color: 'var(--ink-muted)' }}>
                Nenhum item encontrado com esses filtros.
              </p>
            )}
            {filtered.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                currency={currency}
                onOpenModification={setModalItem}
              />
            ))}
          </section>
        </div>
      </div>

      {modalItem && <ModificationModal item={modalItem} onClose={() => setModalItem(null)} />}
      {sorteioOpen && (
        <SorteioModal items={items} currency={currency} onClose={() => setSorteioOpen(false)} />
      )}
    </main>
  );
}
