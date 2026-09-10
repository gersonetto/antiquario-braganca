import { describe, it, expect } from 'vitest';
import { SORTEIO_MODO_LABELS } from './labels';

describe('SORTEIO_MODO_LABELS', () => {
  it('tem entradas para "lote" e "gaveta", cada uma com título e descrição', () => {
    for (const modo of ['lote', 'gaveta'] as const) {
      expect(SORTEIO_MODO_LABELS[modo].title.length).toBeGreaterThan(0);
      expect(SORTEIO_MODO_LABELS[modo].description.length).toBeGreaterThan(0);
    }
  });
});
