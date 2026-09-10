import type { RandomSource } from './types';

/** Fisher-Yates: retorna uma cópia embaralhada de `arr`, sem mutar o original. */
export function shuffle<T>(arr: T[], rng: RandomSource = Math.random): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
