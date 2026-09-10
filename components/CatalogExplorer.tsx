'use client';

import { useMemo, useState } from 'react';
import type { CatalogItem, RaritySlug, CategorySlug } from '@/lib/catalog/types';
import { ItemCard } from './ItemCard';

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
    <main>
      <input
        type="text"
        placeholder="Buscar por nome do item…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div role="group" aria-label="Raridade">
        {RARITIES.map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={rarities.has(r.id)}
            onClick={() => toggle(rarities, r.id, setRarities)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <nav aria-label="Categorias">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={categories.has(c.id)}
            onClick={() => toggle(categories, c.id, setCategories)}
          >
            {c.label}
          </button>
        ))}
      </nav>

      <section>
        {filtered.length === 0 && <p>Nenhuma relíquia encontrada com esses filtros.</p>}
        {filtered.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </section>
    </main>
  );
}
