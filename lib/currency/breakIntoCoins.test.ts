import { describe, it, expect } from 'vitest';
import { breakIntoCoins } from './breakIntoCoins';

describe('breakIntoCoins', () => {
  it('quebra um valor simples sem platina (padrão D&D)', () => {
    expect(breakIntoCoins(199.53, 'dnd')).toEqual({ pp: 0, po: 199, pr: 5, pc: 3 });
  });

  it('quebra em platina quando o valor em ouro passa de 1000, só em múltiplos de 100', () => {
    // 7878,3554 -> 7 milhares completos -> 700 pp, sobra 878 po, 3 pr, 6 pc
    expect(breakIntoCoins(7878.3554, 'dnd')).toEqual({ pp: 700, po: 878, pr: 3, pc: 6 });
  });

  it('platina nunca fica com valor quebrado, sempre múltiplo de 100', () => {
    // 2500,5 -> 2 milhares completos -> 200 pp, sobra 500 po
    const result = breakIntoCoins(2500.5, 'dnd');
    expect(result.pp).toBe(200);
    expect(result.pp % 100).toBe(0);
    expect(result.po).toBe(500);
  });

  it('não quebra em platina abaixo de 1000', () => {
    const result = breakIntoCoins(999.99, 'dnd');
    expect(result.pp).toBe(0);
    expect(result.po).toBe(999);
  });

  it('arredonda o cobre só no final, cascateando o carry', () => {
    // 1,999996 -> po=1, resto vira pr=9,99996 -> pc arredondaria pra 10 -> carry pr=10 -> carry po=2
    expect(breakIntoCoins(1.999996, 'dnd')).toEqual({ pp: 0, po: 2, pr: 0, pc: 0 });
  });

  it('economia de Bragança divide o valor por 10 antes de quebrar', () => {
    // 199,53 / 10 = 19,953 -> 19 po, 9 pr, 5 pc
    expect(breakIntoCoins(199.53, 'braganca')).toEqual({ pp: 0, po: 19, pr: 9, pc: 5 });
  });
});
