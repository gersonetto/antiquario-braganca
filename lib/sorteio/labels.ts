import type { SorteioModo } from './types';

export const SORTEIO_MODO_LABELS: Record<SorteioModo, { title: string; description: string; count: number }> = {
  lote: {
    title: 'Lote do Leiloeiro',
    description:
      'Um arremate variado: 2 relíquias garantidas da temática escolhida, mais 3 ao acaso de todo o acervo daquela raridade.',
    count: 5,
  },
  gaveta: {
    title: 'Gaveta Temática',
    description: '3 relíquias sorteadas de uma única gaveta — raridade e temática escolhidas por você.',
    count: 3,
  },
};
