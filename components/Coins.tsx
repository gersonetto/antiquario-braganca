import { breakIntoCoins, type CurrencyMode } from '@/lib/currency/breakIntoCoins';

const COIN_COLOR: Record<'pp' | 'po' | 'pr' | 'pc', string> = {
  pp: 'var(--coin-pp)',
  po: 'var(--gold-strong)',
  pr: 'var(--coin-pr)',
  pc: 'var(--coin-pc)',
};

export function Coins({ priceGp, mode }: { priceGp: number; mode: CurrencyMode }) {
  const coins = breakIntoCoins(priceGp, mode);
  const order: (keyof typeof coins)[] = ['pp', 'po', 'pr', 'pc'];
  const parts = order.filter((k) => coins[k] > 0);
  if (parts.length === 0) parts.push('po');

  return (
    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      {parts.map((k) => (
        <span key={k} style={{ color: COIN_COLOR[k], fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
          {coins[k]}
          <i style={{ fontStyle: 'normal', fontSize: '0.62em', marginLeft: 1, opacity: 0.82 }}>{k}</i>
        </span>
      ))}
    </div>
  );
}
