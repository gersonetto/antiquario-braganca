import type { CategorySlug, RaritySlug } from './types';

export const RARITIES: { id: RaritySlug; label: string }[] = [
  { id: 'comum', label: 'Comum' },
  { id: 'incomum', label: 'Incomum' },
  { id: 'raro', label: 'Raro' },
  { id: 'muitoraro', label: 'Muito Raro' },
  { id: 'lendario', label: 'Lendário' },
];

export const CATEGORIES: { id: CategorySlug; label: string }[] = [
  { id: 'arcana', label: 'Arcana' },
  { id: 'armamentos', label: 'Armamentos' },
  { id: 'implementos', label: 'Implementos' },
  { id: 'reliquias', label: 'Relíquias' },
  { id: 'consumiveis', label: 'Consumíveis' },
];
