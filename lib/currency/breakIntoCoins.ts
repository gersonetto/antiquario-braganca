export type CurrencyMode = 'braganca' | 'dnd';

export interface CoinBreakdown {
  pp: number;
  po: number;
  pr: number;
  pc: number;
}

const CURRENCY_FACTOR: Record<CurrencyMode, number> = { braganca: 0.1, dnd: 1 };

/**
 * Quebra um valor em ouro (po) fracionário nas 4 moedas do sistema. O decimal vira
 * prata, o resto da prata vira cobre — arredondado só no final da cadeia — e, quando o
 * valor em ouro passa de 1000, o excedente vira platina na razão padrão de D&D
 * (1 pp = 10 po). Ver spec §6.1 para a régua completa.
 */
export function breakIntoCoins(rawGp: number, mode: CurrencyMode): CoinBreakdown {
  const gp = rawGp * CURRENCY_FACTOR[mode];

  let poWhole = Math.floor(gp);
  const fracGp = gp - poWhole;

  const prFloat = fracGp * 10;
  let prWhole = Math.floor(prFloat);
  const fracPr = prFloat - prWhole;

  let pcWhole = Math.round(fracPr * 10);
  if (pcWhole === 10) {
    pcWhole = 0;
    prWhole += 1;
  }
  if (prWhole === 10) {
    prWhole = 0;
    poWhole += 1;
  }

  let ppWhole = 0;
  if (poWhole >= 1000) {
    ppWhole = Math.floor(poWhole / 10);
    poWhole = poWhole % 10;
  }

  return { pp: ppWhole, po: poWhole, pr: prWhole, pc: pcWhole };
}
