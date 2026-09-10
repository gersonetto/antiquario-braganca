import { describe, it, expect } from 'vitest';
import { shuffle } from './shuffle';

describe('shuffle', () => {
  it('produz uma ordem determinística com um rng fixo', () => {
    // Fisher-Yates de trás pra frente (i de n-1 até 1, j = floor(rng()*(i+1))).
    // Com rng() sempre 0, j é sempre 0: cada passo move o elemento da posição 0
    // para a posição i atual, e o antigo arr[i] assume a posição 0.
    // [1,2,3,4,5] -> [5,2,3,4,1] -> [4,2,3,5,1] -> [3,2,4,5,1] -> [2,3,4,5,1]
    const result = shuffle([1, 2, 3, 4, 5], () => 0);
    expect(result).toEqual([2, 3, 4, 5, 1]);
  });

  it('não muta o array original', () => {
    const original = [1, 2, 3];
    const copy = [...original];
    shuffle(original, () => 0);
    expect(original).toEqual(copy);
  });

  it('preserva todos os elementos, sem perda ou duplicação', () => {
    const original = ['a', 'b', 'c', 'd'];
    const result = shuffle(original, Math.random);
    expect(result).toHaveLength(original.length);
    expect([...result].sort()).toEqual([...original].sort());
  });

  it('array vazio retorna vazio', () => {
    expect(shuffle([], Math.random)).toEqual([]);
  });

  it('usa Math.random por padrão quando nenhum rng é passado', () => {
    const result = shuffle([1, 2, 3]);
    expect(result).toHaveLength(3);
  });
});
