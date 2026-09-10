# Antiquário de Bragança — MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the read-only Next.js catalog that reads the mestre's Google Sheets
spreadsheet and renders a searchable, filterable, themed item catalog with the currency
system, deployed to Vercel with ISR.

**Architecture:** A pure data layer (`lib/catalog`, `lib/currency`) with no framework
dependencies, unit-tested with Vitest. A thin `lib/sheets` layer wraps the Google Sheets
API behind one function, `fetchCatalog()`. The Next.js App Router fetches once per page
(ISR, revalidate every 5 minutes) and hands the full item list to one client component
tree that does all search/filter/currency state client-side — mirroring the interaction
model already validated in the Artifact mockup.

**Tech Stack:** Next.js 16 (App Router) + TypeScript, Tailwind CSS 4, `googleapis` for
Sheets access, Vitest for unit tests, deployed on Vercel. (Task 1's `create-next-app@latest`
installed Next 16 / Tailwind v4 rather than the 15/v3 originally anticipated — ruled
acceptable, see ledger. Tailwind v4 uses `@import "tailwindcss"` in `globals.css` instead
of v3's `@tailwind` directives; Task 8 accounts for this.)

**Spec:** `docs/superpowers/specs/2026-09-10-antiquario-braganca-design.md`

## Global Constraints

- Planilha = dado bruto do mestre; site = toda apresentação (spec §2). Nenhuma
  formatação de preço, moeda ou texto acontece na planilha.
- `Rating` (coluna N da planilha) nunca é serializado para o JSON/tipo `CatalogItem` —
  ver spec §3.3.
- `RD` entra no `CatalogItem` mas não é renderizado em nenhum componente de UI neste
  plano — fica pronto para a futura feature de sorteio (fora do MVP).
- Sem tela de login, sem CRUD. Revalidação manual é protegida por um segredo simples de
  URL, não por autenticação de usuário (spec §4).
- Foco desktop — não é necessário otimizar layout para mobile neste plano.
- Paleta e tipografia devem seguir exatamente os tokens da spec §7 (nada de verde
  saturado tipo bandeira, nada de amarelo berrante).
- Moeda: a quebra em pp/po/pr/pc e os dois modos de economia seguem exatamente o
  algoritmo da spec §6 — não reintroduzir arredondamento intermediário.

---

## Task 1: Scaffold do projeto Next.js

**Files:**
- Create: todo o projeto gerado por `create-next-app` na raiz `C:\Claude_Code\antiquario-braganca`

**Interfaces:**
- Produces: projeto Next.js rodável (`npm run dev`), TypeScript, Tailwind, App Router,
  import alias `@/*`.

- [ ] **Step 1: Rodar o scaffold**

```bash
cd C:\Claude_Code\antiquario-braganca
npx create-next-app@latest . --typescript --eslint --tailwind --app --src-dir=false --import-alias "@/*" --use-npm --yes
```

- [ ] **Step 2: Verificar que o dev server sobe**

Run: `npm run dev`
Expected: servidor inicia em `http://localhost:3000` sem erro, página padrão do Next.js
carrega. Pare o servidor (Ctrl+C) depois de confirmar.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project (TypeScript, Tailwind, App Router)"
```

---

## Task 2: Tipos do catálogo e transformação de linha da planilha

**Files:**
- Create: `lib/catalog/types.ts`
- Create: `lib/catalog/transform.ts`
- Test: `lib/catalog/transform.test.ts`

**Interfaces:**
- Produces:
  - `type RaritySlug = 'comum' | 'incomum' | 'raro' | 'muitoraro' | 'lendario'`
  - `type CategorySlug = 'arcana' | 'armamentos' | 'implementos' | 'reliquias' | 'consumiveis'`
  - `interface CatalogItem { id: string; name: string; rarity: RaritySlug; categories: CategorySlug[]; priceGp: number; attun: boolean; type: string; source: string | null; modification: { kind: 'simples' | 'completa'; text: string | null } | null; rd: Partial<Record<CategorySlug, number>>; }`
  - `function rowToCatalogItem(row: unknown[], rarity: RaritySlug): CatalogItem`

- [ ] **Step 1: Instalar Vitest**

```bash
npm install -D vitest
```

Adicione ao `package.json`, dentro de `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Criar os tipos**

Crie `lib/catalog/types.ts`:

```typescript
export type RaritySlug = 'comum' | 'incomum' | 'raro' | 'muitoraro' | 'lendario';

export type CategorySlug =
  | 'arcana'
  | 'armamentos'
  | 'implementos'
  | 'reliquias'
  | 'consumiveis';

export interface CatalogItem {
  id: string;
  name: string;
  rarity: RaritySlug;
  categories: CategorySlug[];
  priceGp: number;
  attun: boolean;
  type: string;
  source: string | null;
  modification: { kind: 'simples' | 'completa'; text: string | null } | null;
  rd: Partial<Record<CategorySlug, number>>;
}
```

- [ ] **Step 3: Escrever o teste que falha**

Crie `lib/catalog/transform.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { rowToCatalogItem } from './transform';

// Layout de coluna (índice 0-based, planilha A2:S...):
// 0 ID, 1 Name, 2-6 categorias (Arcana..Consumíveis), 7 Price, 8 Attun,
// 9 Type, 10 Source, 11 Tipo de modificação, 12 Texto da modificação,
// 13 Rating, 14-18 RD por categoria (Arcana..Consumíveis)
function baseRow(overrides: Record<number, unknown> = {}): unknown[] {
  const row: unknown[] = [
    'COM-001', 'Bottle of Boundless Coffee',
    true, true, true, true, false,
    199.53,
    false,
    'Wondrous', 'SCC 38',
    'Original', '',
    10,
    1, 3, 2, 1, undefined,
  ];
  for (const [i, v] of Object.entries(overrides)) row[Number(i)] = v;
  return row;
}

describe('rowToCatalogItem', () => {
  it('converte campos básicos corretamente', () => {
    const item = rowToCatalogItem(baseRow(), 'comum');
    expect(item.id).toBe('COM-001');
    expect(item.name).toBe('Bottle of Boundless Coffee');
    expect(item.rarity).toBe('comum');
    expect(item.priceGp).toBe(199.53);
    expect(item.attun).toBe(false);
    expect(item.type).toBe('Wondrous');
    expect(item.source).toBe('SCC 38');
  });

  it('lê as categorias marcadas como true, ignorando as false', () => {
    const item = rowToCatalogItem(baseRow(), 'comum');
    expect(item.categories).toEqual(['arcana', 'armamentos', 'implementos', 'reliquias']);
  });

  it('inclui RD só das categorias marcadas', () => {
    const item = rowToCatalogItem(baseRow(), 'comum');
    expect(item.rd).toEqual({ arcana: 1, armamentos: 3, implementos: 2, reliquias: 1 });
  });

  it('nunca inclui o Rating no item retornado', () => {
    const item = rowToCatalogItem(baseRow(), 'comum');
    expect('rating' in item).toBe(false);
  });

  it('modification é null quando Tipo de modificação é Original', () => {
    const item = rowToCatalogItem(baseRow(), 'comum');
    expect(item.modification).toBeNull();
  });

  it('monta modification "completa" com o texto do mestre', () => {
    const row = baseRow({ 11: 'Completa', 12: 'Texto de exemplo do mestre.' });
    const item = rowToCatalogItem(row, 'comum');
    expect(item.modification).toEqual({ kind: 'completa', text: 'Texto de exemplo do mestre.' });
  });

  it('monta modification "simples" sem exigir texto', () => {
    const row = baseRow({ 11: 'Simples', 12: '' });
    const item = rowToCatalogItem(row, 'comum');
    expect(item.modification).toEqual({ kind: 'simples', text: null });
  });

  it('source vazio vira null, não string vazia', () => {
    const row = baseRow({ 10: '' });
    const item = rowToCatalogItem(row, 'comum');
    expect(item.source).toBeNull();
  });
});
```

- [ ] **Step 4: Rodar o teste e confirmar que falha**

Run: `npm test`
Expected: FALHA — `lib/catalog/transform.ts` ainda não existe.

- [ ] **Step 5: Implementar `rowToCatalogItem`**

Crie `lib/catalog/transform.ts`:

```typescript
import type { CatalogItem, CategorySlug, RaritySlug } from './types';

const CATEGORY_COLUMNS: { index: number; slug: CategorySlug }[] = [
  { index: 2, slug: 'arcana' },
  { index: 3, slug: 'armamentos' },
  { index: 4, slug: 'implementos' },
  { index: 5, slug: 'reliquias' },
  { index: 6, slug: 'consumiveis' },
];

const RD_COLUMNS: { index: number; slug: CategorySlug }[] = [
  { index: 14, slug: 'arcana' },
  { index: 15, slug: 'armamentos' },
  { index: 16, slug: 'implementos' },
  { index: 17, slug: 'reliquias' },
  { index: 18, slug: 'consumiveis' },
];

export function rowToCatalogItem(row: unknown[], rarity: RaritySlug): CatalogItem {
  const categories = CATEGORY_COLUMNS.filter((c) => row[c.index] === true).map(
    (c) => c.slug
  );

  const rd: Partial<Record<CategorySlug, number>> = {};
  for (const c of RD_COLUMNS) {
    const value = row[c.index];
    if (typeof value === 'number') rd[c.slug] = value;
  }

  const modKind = row[11] as string | undefined;
  const modText = (row[12] as string | undefined) || null;
  const modification =
    modKind === 'Simples' || modKind === 'Completa'
      ? {
          kind: (modKind === 'Simples' ? 'simples' : 'completa') as 'simples' | 'completa',
          text: modText,
        }
      : null;

  return {
    id: String(row[0]),
    name: String(row[1]),
    rarity,
    categories,
    priceGp: Number(row[7]),
    attun: row[8] === true,
    type: String(row[9] ?? ''),
    source: (row[10] as string | undefined) || null,
    modification,
    rd,
    // row[13] é o Rating — uso exclusivo do mestre na planilha, nunca sai daqui.
  };
}
```

- [ ] **Step 6: Rodar o teste e confirmar que passa**

Run: `npm test`
Expected: PASS — 8 testes verdes.

- [ ] **Step 7: Commit**

```bash
git add lib/catalog/types.ts lib/catalog/transform.ts lib/catalog/transform.test.ts package.json
git commit -m "feat: add catalog types and Sheets row transform"
```

---

## Task 3: Validação do catálogo (ID e RD duplicados)

**Files:**
- Create: `lib/catalog/validate.ts`
- Test: `lib/catalog/validate.test.ts`

**Interfaces:**
- Consumes: `CatalogItem` (Task 2)
- Produces:
  - `class CatalogValidationError extends Error {}`
  - `function validateCatalog(items: CatalogItem[]): void` — lança `CatalogValidationError`
    se encontrar problema; não retorna nada em caso de sucesso.

- [ ] **Step 1: Escrever o teste que falha**

Crie `lib/catalog/validate.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { validateCatalog, CatalogValidationError } from './validate';
import type { CatalogItem } from './types';

function item(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: 'COM-001',
    name: 'Item Teste',
    rarity: 'comum',
    categories: ['arcana'],
    priceGp: 100,
    attun: false,
    type: 'Wondrous',
    source: null,
    modification: null,
    rd: { arcana: 1 },
    ...overrides,
  };
}

describe('validateCatalog', () => {
  it('não lança erro para um catálogo válido', () => {
    const items = [
      item({ id: 'COM-001', rd: { arcana: 1 } }),
      item({ id: 'COM-002', rd: { arcana: 2 } }),
    ];
    expect(() => validateCatalog(items)).not.toThrow();
  });

  it('lança erro para ID duplicado', () => {
    const items = [item({ id: 'COM-001' }), item({ id: 'COM-001' })];
    expect(() => validateCatalog(items)).toThrow(CatalogValidationError);
  });

  it('lança erro para RD duplicado na mesma raridade e categoria', () => {
    const items = [
      item({ id: 'COM-001', rd: { arcana: 5 } }),
      item({ id: 'COM-002', rd: { arcana: 5 } }),
    ];
    expect(() => validateCatalog(items)).toThrow(CatalogValidationError);
  });

  it('NÃO lança erro para o mesmo RD em categorias diferentes (é escopado por categoria)', () => {
    const items = [
      item({ id: 'COM-001', categories: ['arcana'], rd: { arcana: 5 } }),
      item({ id: 'COM-002', categories: ['armamentos'], rd: { armamentos: 5 } }),
    ];
    expect(() => validateCatalog(items)).not.toThrow();
  });

  it('NÃO lança erro para o mesmo RD na mesma categoria de raridades diferentes', () => {
    const items = [
      item({ id: 'COM-001', rarity: 'comum', rd: { arcana: 5 } }),
      item({ id: 'UNC-001', rarity: 'incomum', rd: { arcana: 5 } }),
    ];
    expect(() => validateCatalog(items)).not.toThrow();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm test`
Expected: FALHA — `lib/catalog/validate.ts` ainda não existe.

- [ ] **Step 3: Implementar**

Crie `lib/catalog/validate.ts`:

```typescript
import type { CatalogItem } from './types';

export class CatalogValidationError extends Error {}

export function validateCatalog(items: CatalogItem[]): void {
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.id)) {
      throw new CatalogValidationError(`ID duplicado: ${item.id}`);
    }
    ids.add(item.id);
  }

  const rdSeen = new Map<string, string>();
  for (const item of items) {
    for (const [category, rd] of Object.entries(item.rd)) {
      const key = `${item.rarity}|${category}|${rd}`;
      const existing = rdSeen.get(key);
      if (existing) {
        throw new CatalogValidationError(
          `RD duplicado: ${item.rarity}/${category}/RD=${rd} usado por "${existing}" e "${item.name}"`
        );
      }
      rdSeen.set(key, item.name);
    }
  }
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/catalog/validate.ts lib/catalog/validate.test.ts
git commit -m "feat: add catalog validation (duplicate ID / RD)"
```

---

## Task 4: Sistema monetário (quebra em moedas + economia de Bragança)

**Files:**
- Create: `lib/currency/breakIntoCoins.ts`
- Test: `lib/currency/breakIntoCoins.test.ts`

**Interfaces:**
- Produces:
  - `type CurrencyMode = 'braganca' | 'dnd'`
  - `interface CoinBreakdown { pp: number; po: number; pr: number; pc: number }`
  - `function breakIntoCoins(rawGp: number, mode: CurrencyMode): CoinBreakdown`

- [ ] **Step 1: Escrever os testes que falham**

Crie `lib/currency/breakIntoCoins.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { breakIntoCoins } from './breakIntoCoins';

describe('breakIntoCoins', () => {
  it('quebra um valor simples sem platina (padrão D&D)', () => {
    expect(breakIntoCoins(199.53, 'dnd')).toEqual({ pp: 0, po: 199, pr: 5, pc: 3 });
  });

  it('quebra em platina quando o valor em ouro passa de 1000 (razão 1pp=10po)', () => {
    // exemplo da spec: 7878,3554 -> 787 pp, 8 po, 3 pr, 6 pc
    expect(breakIntoCoins(7878.3554, 'dnd')).toEqual({ pp: 787, po: 8, pr: 3, pc: 6 });
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
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm test`
Expected: FALHA — `lib/currency/breakIntoCoins.ts` ainda não existe.

- [ ] **Step 3: Implementar**

Crie `lib/currency/breakIntoCoins.ts`:

```typescript
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
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/currency/breakIntoCoins.ts lib/currency/breakIntoCoins.test.ts
git commit -m "feat: add coin breakdown and Bragança economy conversion"
```

---

## Task 5: Cliente da API do Google Sheets (conta de serviço)

**Files:**
- Create: `lib/sheets/client.ts`
- Test: `lib/sheets/client.test.ts`
- Create: `.env.example`
- Modify: `.gitignore` (garantir que `.env*.local` está ignorado — o `create-next-app`
  já adiciona isso por padrão; conferir e não duplicar)

**Interfaces:**
- Produces: `function getSheetsClient(): sheets_v4.Sheets` — lança erro claro se as
  variáveis de ambiente estiverem ausentes.

- [ ] **Step 1: Instalar a dependência**

```bash
npm install googleapis
```

- [ ] **Step 2: Escrever o teste que falha**

Crie `lib/sheets/client.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSheetsClient } from './client';

const ORIGINAL_ENV = { ...process.env };

describe('getSheetsClient', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('lança erro claro quando faltam as credenciais', () => {
    delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    delete process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
    expect(() => getSheetsClient()).toThrow(/Credenciais da conta de serviço/);
  });

  it('constrói o cliente quando as credenciais existem', () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'fake@example.iam.gserviceaccount.com';
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY =
      '-----BEGIN PRIVATE KEY-----\\nFAKEKEY\\n-----END PRIVATE KEY-----\\n';
    const client = getSheetsClient();
    expect(client.spreadsheets.values.batchGet).toBeTypeOf('function');
  });
});
```

- [ ] **Step 3: Rodar o teste e confirmar que falha**

Run: `npm test`
Expected: FALHA — `lib/sheets/client.ts` ainda não existe.

- [ ] **Step 4: Implementar**

Crie `lib/sheets/client.ts`:

```typescript
import { google, sheets_v4 } from 'googleapis';

export function getSheetsClient(): sheets_v4.Sheets {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error(
      'Credenciais da conta de serviço do Google ausentes ' +
        '(GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY).'
    );
  }

  const privateKey = rawKey.replace(/\\n/g, '\n');
  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}
```

- [ ] **Step 5: Rodar o teste e confirmar que passa**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Criar `.env.example`**

Crie `.env.example` na raiz:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
GOOGLE_SHEETS_SPREADSHEET_ID=
REVALIDATE_SECRET=
```

- [ ] **Step 7: Conferir o `.gitignore`**

Abra `.gitignore` (gerado pelo `create-next-app`) e confirme que já existe uma linha
`.env*.local` — se não existir, adicione. **Não** commite nenhum valor real de
credencial.

- [ ] **Step 8: Commit**

```bash
git add lib/sheets/client.ts lib/sheets/client.test.ts .env.example .gitignore package.json package-lock.json
git commit -m "feat: add Google Sheets service-account client"
```

---

## Task 6: Orquestração do pipeline (`fetchCatalog`)

**Files:**
- Create: `lib/catalog/fetchCatalog.ts`
- Test: `lib/catalog/fetchCatalog.test.ts`

**Interfaces:**
- Consumes: `getSheetsClient` (Task 5), `rowToCatalogItem` (Task 2), `validateCatalog`
  (Task 3)
- Produces: `async function fetchCatalog(): Promise<CatalogItem[]>`

- [ ] **Step 1: Escrever o teste que falha**

Crie `lib/catalog/fetchCatalog.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchCatalog } from './fetchCatalog';

vi.mock('@/lib/sheets/client', () => ({
  getSheetsClient: vi.fn(),
}));

import { getSheetsClient } from '@/lib/sheets/client';

const ORIGINAL_ENV = { ...process.env };

describe('fetchCatalog', () => {
  beforeEach(() => {
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID = 'fake-id';
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.resetAllMocks();
  });

  it('lança erro claro quando falta o ID da planilha', async () => {
    delete process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    await expect(fetchCatalog()).rejects.toThrow(/GOOGLE_SHEETS_SPREADSHEET_ID/);
  });

  it('converte as 5 abas em uma lista única de itens e valida', async () => {
    const comumRow = [
      'COM-001', 'Item Comum', true, false, false, false, false,
      100, false, 'Wondrous', '', 'Original', '', 5, 1, undefined, undefined, undefined, undefined,
    ];
    const raroRow = [
      'RAR-001', 'Item Raro', false, true, false, false, false,
      2000, true, 'Armor', 'DMG', 'Original', '', 8, undefined, 3, undefined, undefined, undefined,
    ];

    (getSheetsClient as ReturnType<typeof vi.fn>).mockReturnValue({
      spreadsheets: {
        values: {
          batchGet: vi.fn().mockResolvedValue({
            data: {
              valueRanges: [
                { values: [comumRow] }, // Common
                { values: [] },          // Uncommon
                { values: [raroRow] },   // Rare
                { values: [] },          // Very Rare
                { values: [] },          // Legendary
              ],
            },
          }),
        },
      },
    });

    const items = await fetchCatalog();
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ id: 'COM-001', rarity: 'comum' });
    expect(items[1]).toMatchObject({ id: 'RAR-001', rarity: 'raro' });
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm test`
Expected: FALHA — `lib/catalog/fetchCatalog.ts` ainda não existe.

- [ ] **Step 3: Implementar**

Crie `lib/catalog/fetchCatalog.ts`:

```typescript
import { getSheetsClient } from '@/lib/sheets/client';
import { rowToCatalogItem } from './transform';
import { validateCatalog } from './validate';
import type { CatalogItem, RaritySlug } from './types';

const SHEET_TABS: { name: string; rarity: RaritySlug }[] = [
  { name: 'Common', rarity: 'comum' },
  { name: 'Uncommon', rarity: 'incomum' },
  { name: 'Rare', rarity: 'raro' },
  { name: 'Very Rare', rarity: 'muitoraro' },
  { name: 'Legendary', rarity: 'lendario' },
];

const RANGE_SUFFIX = 'A2:S1000';

export async function fetchCatalog(): Promise<CatalogItem[]> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID ausente.');
  }

  const sheets = getSheetsClient();
  const ranges = SHEET_TABS.map((t) => `'${t.name}'!${RANGE_SUFFIX}`);

  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  const items: CatalogItem[] = [];
  (res.data.valueRanges ?? []).forEach((valueRange, i) => {
    const rarity = SHEET_TABS[i].rarity;
    for (const row of valueRange.values ?? []) {
      if (!row[0]) continue; // linha vazia no fim do range
      items.push(rowToCatalogItem(row, rarity));
    }
  });

  validateCatalog(items);
  return items;
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/catalog/fetchCatalog.ts lib/catalog/fetchCatalog.test.ts
git commit -m "feat: orchestrate Sheets fetch into validated catalog"
```

---

## Task 7: Catálogo mínimo (página + busca + filtros, sem tema)

**Files:**
- Modify: `app/page.tsx`
- Create: `components/CatalogExplorer.tsx`
- Create: `components/ItemCard.tsx`

**Interfaces:**
- Consumes: `fetchCatalog` (Task 6), `CatalogItem`, `RaritySlug`, `CategorySlug` (Task 2)
- Produces: página inicial funcional em `/`.

- [ ] **Step 1: Página server component com ISR**

Substitua o conteúdo de `app/page.tsx`:

```tsx
import { fetchCatalog } from '@/lib/catalog/fetchCatalog';
import { CatalogExplorer } from '@/components/CatalogExplorer';

export const revalidate = 300; // 5 minutos, ver spec §4

export default async function HomePage() {
  const items = await fetchCatalog();
  return <CatalogExplorer items={items} />;
}
```

- [ ] **Step 2: Componente de item, sem estilo ainda**

Crie `components/ItemCard.tsx`:

```tsx
import type { CatalogItem } from '@/lib/catalog/types';

const RARITY_LABEL: Record<CatalogItem['rarity'], string> = {
  comum: 'Comum',
  incomum: 'Incomum',
  raro: 'Raro',
  muitoraro: 'Muito Raro',
  lendario: 'Lendário',
};

const CATEGORY_LABEL: Record<string, string> = {
  arcana: 'Arcana',
  armamentos: 'Armamentos',
  implementos: 'Implementos',
  reliquias: 'Relíquias',
  consumiveis: 'Consumíveis',
};

export function ItemCard({ item }: { item: CatalogItem }) {
  return (
    <article>
      <p>{RARITY_LABEL[item.rarity]}</p>
      <h3>{item.name}</h3>
      <p>{item.categories.map((c) => CATEGORY_LABEL[c]).join(', ')}</p>
      <p>{item.type}{item.attun ? ' · Sintonia' : ''}</p>
      <p>{item.priceGp.toFixed(2)} po</p>
      {item.source && <p>Proveniência: {item.source}</p>}
    </article>
  );
}
```

- [ ] **Step 3: Componente com estado de busca e filtros**

Crie `components/CatalogExplorer.tsx`:

```tsx
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
```

- [ ] **Step 4: Verificar manualmente**

Run: `npm run dev`
Expected: abrindo `http://localhost:3000` (com as variáveis de ambiente da Task 5
configuradas num `.env.local`), a lista de itens reais da planilha aparece; digitar na
busca e clicar nos botões de raridade/categoria filtra a lista. Sem estilo ainda — isso é
esperado, vem na próxima task.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx components/CatalogExplorer.tsx components/ItemCard.tsx
git commit -m "feat: minimal catalog page with search and filters"
```

---

## Task 8: Tema visual "relicário imperial"

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `components/ItemCard.tsx`
- Modify: `components/CatalogExplorer.tsx`

**Interfaces:**
- Consumes: tokens de cor/tipografia da spec §7 (já validados no mockup Artifact).

- [ ] **Step 1: Importar as fontes no layout**

Substitua **todo o conteúdo** de `app/layout.tsx` por (mantém as fontes Geist que o
`create-next-app` já configurou — elas ficam sem uso nesta versão do tema, mas remover a
configuração não é necessário; adiciona as fontes do tema via `<link>` direto, igual ao
mockup, por simplicidade; corrige `lang` para `pt-BR` e o título/descrição da página):

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Antiquário de Bragança",
  description: "Catálogo de relíquias mágicas do Antiquário de Bragança",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600&family=Cormorant+Garamond:ital,wght@500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Tokens de cor em `app/globals.css`**

O `create-next-app` deste projeto instalou Tailwind CSS v4, que usa `@import
"tailwindcss";` em vez das diretivas `@tailwind` da v3 — substitua **todo o conteúdo**
de `app/globals.css` (descartando o tema `--background`/`--foreground`/`@theme inline`
gerado por padrão, que não usaremos) por:

```css
@import "tailwindcss";

:root {
  --bg: #ede3cb;
  --surface: #f5eedc;
  --ink: #2b2116;
  --ink-muted: #6b5d45;
  --border: #c9b685;
  --brand: #1c3b2e;
  --brand-ink: #f1e6c4;
  --gold: #8c641f;
  --gold-strong: #6e4e17;
  --seal: #7a2331;
  --rarity-comum: #847a66;
  --rarity-incomum: #3f6b4a;
  --rarity-raro: #2e4c6e;
  --rarity-muitoraro: #5b3568;
  --rarity-lendario: #b9760e;
  --coin-pp: #5d6b76;
  --coin-pr: #79735f;
  --coin-pc: #8b4a2b;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --bg: #0f1b15;
    --surface: #182a20;
    --ink: #ece0c0;
    --ink-muted: #afa079;
    --border: #3a4f3e;
    --brand: #0a1711;
    --brand-ink: #e7d6a0;
    --gold: #d3ac5d;
    --gold-strong: #e6c57a;
    --seal: #c15c68;
    --rarity-comum: #a79c82;
    --rarity-incomum: #5fa075;
    --rarity-raro: #6c93c4;
    --rarity-muitoraro: #9873ae;
    --rarity-lendario: #e0a83e;
    --coin-pp: #9aaab6;
    --coin-pr: #b4ac94;
    --coin-pc: #c97a4e;
  }
}

body {
  background: var(--bg);
  color: var(--ink);
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
}
```

- [ ] **Step 3: Aplicar classes Tailwind com os tokens em `ItemCard.tsx`**

Reescreva `components/ItemCard.tsx` usando classes utilitárias com valor arbitrário
apontando para as variáveis (padrão usado no mockup):

```tsx
import type { CatalogItem } from '@/lib/catalog/types';

const RARITY_LABEL: Record<CatalogItem['rarity'], string> = {
  comum: 'Comum',
  incomum: 'Incomum',
  raro: 'Raro',
  muitoraro: 'Muito Raro',
  lendario: 'Lendário',
};

const CATEGORY_LABEL: Record<string, string> = {
  arcana: 'Arcana',
  armamentos: 'Armamentos',
  implementos: 'Implementos',
  reliquias: 'Relíquias',
  consumiveis: 'Consumíveis',
};

export function ItemCard({ item }: { item: CatalogItem }) {
  return (
    <article
      className="relative flex flex-col gap-2 border p-4"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <span
        className="absolute right-0 top-0 h-0 w-0"
        style={{
          borderStyle: 'solid',
          borderWidth: '0 22px 22px 0',
          borderColor: `transparent var(--rarity-${item.rarity}) transparent transparent`,
        }}
      />
      <div className="flex items-baseline justify-between text-xs">
        <span style={{ color: 'var(--ink-muted)' }}>
          {item.categories.map((c) => CATEGORY_LABEL[c]).join(', ')}
        </span>
        <span style={{ color: `var(--rarity-${item.rarity})` }}>
          {RARITY_LABEL[item.rarity]}
        </span>
      </div>
      <h3 className="text-xl" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
        {item.name}
      </h3>
      <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
        {item.type}
        {item.attun ? ' · Sintonia' : ''}
      </p>
      {item.source && (
        <p className="mt-auto text-xs italic" style={{ color: 'var(--ink-muted)' }}>
          Proveniência: {item.source}
        </p>
      )}
    </article>
  );
}
```

- [ ] **Step 4: Aplicar layout temático em `CatalogExplorer.tsx`**

Substitua **todo o conteúdo** de `components/CatalogExplorer.tsx` por:

```tsx
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
    <main className="mx-auto max-w-6xl px-6 pb-16" style={{ color: 'var(--ink)' }}>
      <div
        className="mb-6 flex flex-wrap items-center gap-4 border-b py-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <label
          className="flex min-w-[200px] flex-1 items-center gap-2 border px-3 py-2"
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
              className="border px-3 py-1.5 text-sm"
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
      </div>

      <div className="grid grid-cols-[168px_1fr] gap-8">
        <nav aria-label="Categorias" className="flex flex-col gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={categories.has(c.id)}
              onClick={() => toggle(categories, c.id, setCategories)}
              className="border-l-2 px-3 py-2 text-left text-xs"
              style={{
                borderColor: categories.has(c.id) ? 'var(--gold)' : 'transparent',
                background: categories.has(c.id) ? 'var(--surface)' : 'transparent',
                color: categories.has(c.id) ? 'var(--ink)' : 'var(--ink-muted)',
              }}
            >
              {c.label}
            </button>
          ))}
        </nav>

        <section
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(228px, 1fr))' }}
        >
          {filtered.length === 0 && (
            <p style={{ color: 'var(--ink-muted)' }}>
              Nenhuma relíquia encontrada com esses filtros.
            </p>
          )}
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Verificar manualmente**

Run: `npm run dev`
Expected: paleta pergaminho/verde-imperial/dourado aplicada, tipografia Cinzel no
masthead (se já existir) e Cormorant Garamond nos nomes dos itens, canto colorido por
raridade em cada card — visual equivalente ao mockup publicado como Artifact.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css app/layout.tsx components/ItemCard.tsx components/CatalogExplorer.tsx
git commit -m "feat: apply Bragança visual theme to catalog"
```

---

## Task 9: Selo e modal de modificação

**Files:**
- Create: `components/ModificationModal.tsx`
- Modify: `components/ItemCard.tsx`
- Modify: `components/CatalogExplorer.tsx`

**Interfaces:**
- Consumes: `CatalogItem.modification` (Task 2)
- Produces: `function ModificationModal({ item, onClose }: { item: CatalogItem; onClose: () => void }): JSX.Element`

- [ ] **Step 1: Criar o modal**

Crie `components/ModificationModal.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import type { CatalogItem } from '@/lib/catalog/types';

export function ModificationModal({
  item,
  onClose,
}: {
  item: CatalogItem;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!item.modification || item.modification.kind !== 'completa') return null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17,12,6,.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 10,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--gold)',
          maxWidth: 420,
          width: '100%',
          padding: '26px',
        }}
      >
        <button type="button" onClick={onClose} aria-label="Fechar">
          Fechar ✕
        </button>
        <p style={{ color: 'var(--seal)' }}>Anotação do mestre</p>
        <h2 id="modal-title" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          {item.name}
        </h2>
        <p style={{ fontFamily: "'Cormorant Garamond', serif" }}>{item.modification.text}</p>
      </div>
    </div>
  );
}
```

Itens com `modification.kind === 'simples'` não abrem modal — o texto não é obrigatório
para esse tipo (spec original: dedutível dos próprios campos). Trate-os como um selo
apenas informativo, sem clique, na Task de `ItemCard` abaixo.

- [ ] **Step 2: Adicionar o selo em `ItemCard.tsx`**

Substitua **todo o conteúdo** de `components/ItemCard.tsx` por:

```tsx
import type { CatalogItem } from '@/lib/catalog/types';

const RARITY_LABEL: Record<CatalogItem['rarity'], string> = {
  comum: 'Comum',
  incomum: 'Incomum',
  raro: 'Raro',
  muitoraro: 'Muito Raro',
  lendario: 'Lendário',
};

const CATEGORY_LABEL: Record<string, string> = {
  arcana: 'Arcana',
  armamentos: 'Armamentos',
  implementos: 'Implementos',
  reliquias: 'Relíquias',
  consumiveis: 'Consumíveis',
};

export function ItemCard({
  item,
  onOpenModification,
}: {
  item: CatalogItem;
  onOpenModification: (item: CatalogItem) => void;
}) {
  return (
    <article
      className="relative flex flex-col gap-2 border p-4"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <span
        className="absolute right-0 top-0 h-0 w-0"
        style={{
          borderStyle: 'solid',
          borderWidth: '0 22px 22px 0',
          borderColor: `transparent var(--rarity-${item.rarity}) transparent transparent`,
        }}
      />

      {item.modification?.kind === 'completa' && (
        <button
          type="button"
          aria-label={`Ver anotação do mestre sobre ${item.name}`}
          onClick={() => onOpenModification(item)}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-xs"
          style={{ background: 'var(--seal)', color: 'var(--surface)' }}
        >
          ✦
        </button>
      )}
      {item.modification?.kind === 'simples' && (
        <span
          title="Atributos ajustados pelo mestre"
          className="absolute right-2 top-2 text-xs"
          style={{ color: 'var(--ink-muted)' }}
        >
          ✦
        </span>
      )}

      <div className="flex items-baseline justify-between text-xs">
        <span style={{ color: 'var(--ink-muted)' }}>
          {item.categories.map((c) => CATEGORY_LABEL[c]).join(', ')}
        </span>
        <span style={{ color: `var(--rarity-${item.rarity})` }}>
          {RARITY_LABEL[item.rarity]}
        </span>
      </div>

      <h3 className="text-xl" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
        {item.name}
      </h3>

      <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
        {item.type}
        {item.attun ? ' · Sintonia' : ''}
      </p>

      <div className="mt-auto flex items-end justify-between gap-2 border-t pt-2" style={{ borderColor: 'var(--border)' }}>
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
          {item.priceGp.toFixed(2)} po
        </span>
      </div>

      {item.source && (
        <p className="text-right text-xs italic" style={{ color: 'var(--ink-muted)' }}>
          Proveniência: {item.source}
        </p>
      )}
    </article>
  );
}
```

- [ ] **Step 3: Ligar o estado do modal em `CatalogExplorer.tsx`**

Substitua **todo o conteúdo** de `components/CatalogExplorer.tsx` por:

```tsx
'use client';

import { useMemo, useState } from 'react';
import type { CatalogItem, RaritySlug, CategorySlug } from '@/lib/catalog/types';
import { ItemCard } from './ItemCard';
import { ModificationModal } from './ModificationModal';

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
  const [modalItem, setModalItem] = useState<CatalogItem | null>(null);

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
    <main className="mx-auto max-w-6xl px-6 pb-16" style={{ color: 'var(--ink)' }}>
      <div
        className="mb-6 flex flex-wrap items-center gap-4 border-b py-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <label
          className="flex min-w-[200px] flex-1 items-center gap-2 border px-3 py-2"
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
              className="border px-3 py-1.5 text-sm"
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
      </div>

      <div className="grid grid-cols-[168px_1fr] gap-8">
        <nav aria-label="Categorias" className="flex flex-col gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={categories.has(c.id)}
              onClick={() => toggle(categories, c.id, setCategories)}
              className="border-l-2 px-3 py-2 text-left text-xs"
              style={{
                borderColor: categories.has(c.id) ? 'var(--gold)' : 'transparent',
                background: categories.has(c.id) ? 'var(--surface)' : 'transparent',
                color: categories.has(c.id) ? 'var(--ink)' : 'var(--ink-muted)',
              }}
            >
              {c.label}
            </button>
          ))}
        </nav>

        <section
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(228px, 1fr))' }}
        >
          {filtered.length === 0 && (
            <p style={{ color: 'var(--ink-muted)' }}>
              Nenhuma relíquia encontrada com esses filtros.
            </p>
          )}
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} onOpenModification={setModalItem} />
          ))}
        </section>
      </div>

      {modalItem && <ModificationModal item={modalItem} onClose={() => setModalItem(null)} />}
    </main>
  );
}
```

- [ ] **Step 4: Verificar manualmente**

Run: `npm run dev`
Expected: nenhum item real tem `Tipo de modificação` diferente de `Original` ainda (a
planilha migrada não tem nenhuma modificação cadastrada) — para testar, marque
manualmente um item na planilha como `Completa` com um texto, espere a revalidação (ou
force com `npm run dev` reiniciado) e confirme que o selo aparece e o modal abre/fecha
com Esc, clique fora, ou o botão Fechar.

- [ ] **Step 5: Commit**

```bash
git add components/ModificationModal.tsx components/ItemCard.tsx components/CatalogExplorer.tsx
git commit -m "feat: add modification seal and modal"
```

---

## Task 10: Alternador de moeda integrado ao catálogo

**Files:**
- Create: `components/CurrencyToggle.tsx`
- Create: `components/Coins.tsx`
- Modify: `components/ItemCard.tsx`
- Modify: `components/CatalogExplorer.tsx`

**Interfaces:**
- Consumes: `breakIntoCoins`, `CurrencyMode` (Task 4)
- Produces: `function Coins({ priceGp, mode }: { priceGp: number; mode: CurrencyMode }): JSX.Element`

- [ ] **Step 1: Componente de moedas**

Crie `components/Coins.tsx`:

```tsx
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
```

- [ ] **Step 2: Alternador**

Crie `components/CurrencyToggle.tsx`:

```tsx
'use client';

import type { CurrencyMode } from '@/lib/currency/breakIntoCoins';

export function CurrencyToggle({
  mode,
  onChange,
}: {
  mode: CurrencyMode;
  onChange: (mode: CurrencyMode) => void;
}) {
  return (
    <div role="group" aria-label="Sistema monetário" style={{ display: 'flex', border: '1px solid var(--border)' }}>
      <button
        type="button"
        aria-pressed={mode === 'braganca'}
        onClick={() => onChange('braganca')}
      >
        Economia de Bragança
      </button>
      <button type="button" aria-pressed={mode === 'dnd'} onClick={() => onChange('dnd')}>
        Padrão D&amp;D
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Ligar tudo em `CatalogExplorer.tsx`**

Substitua **todo o conteúdo** de `components/CatalogExplorer.tsx` por:

```tsx
'use client';

import { useMemo, useState } from 'react';
import type { CatalogItem, RaritySlug, CategorySlug } from '@/lib/catalog/types';
import type { CurrencyMode } from '@/lib/currency/breakIntoCoins';
import { ItemCard } from './ItemCard';
import { ModificationModal } from './ModificationModal';
import { CurrencyToggle } from './CurrencyToggle';

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
  const [currency, setCurrency] = useState<CurrencyMode>('braganca');
  const [modalItem, setModalItem] = useState<CatalogItem | null>(null);

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
    <main className="mx-auto max-w-6xl px-6 pb-16" style={{ color: 'var(--ink)' }}>
      <div
        className="mb-6 flex flex-wrap items-center gap-4 border-b py-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <label
          className="flex min-w-[200px] flex-1 items-center gap-2 border px-3 py-2"
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
              className="border px-3 py-1.5 text-sm"
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
      </div>

      <div className="grid grid-cols-[168px_1fr] gap-8">
        <nav aria-label="Categorias" className="flex flex-col gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={categories.has(c.id)}
              onClick={() => toggle(categories, c.id, setCategories)}
              className="border-l-2 px-3 py-2 text-left text-xs"
              style={{
                borderColor: categories.has(c.id) ? 'var(--gold)' : 'transparent',
                background: categories.has(c.id) ? 'var(--surface)' : 'transparent',
                color: categories.has(c.id) ? 'var(--ink)' : 'var(--ink-muted)',
              }}
            >
              {c.label}
            </button>
          ))}
        </nav>

        <section
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(228px, 1fr))' }}
        >
          {filtered.length === 0 && (
            <p style={{ color: 'var(--ink-muted)' }}>
              Nenhuma relíquia encontrada com esses filtros.
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

      {modalItem && <ModificationModal item={modalItem} onClose={() => setModalItem(null)} />}
    </main>
  );
}
```

- [ ] **Step 4: Usar `<Coins>` em `ItemCard.tsx`**

Substitua **todo o conteúdo** de `components/ItemCard.tsx` por:

```tsx
import type { CatalogItem } from '@/lib/catalog/types';
import type { CurrencyMode } from '@/lib/currency/breakIntoCoins';
import { Coins } from './Coins';

const RARITY_LABEL: Record<CatalogItem['rarity'], string> = {
  comum: 'Comum',
  incomum: 'Incomum',
  raro: 'Raro',
  muitoraro: 'Muito Raro',
  lendario: 'Lendário',
};

const CATEGORY_LABEL: Record<string, string> = {
  arcana: 'Arcana',
  armamentos: 'Armamentos',
  implementos: 'Implementos',
  reliquias: 'Relíquias',
  consumiveis: 'Consumíveis',
};

export function ItemCard({
  item,
  currency,
  onOpenModification,
}: {
  item: CatalogItem;
  currency: CurrencyMode;
  onOpenModification: (item: CatalogItem) => void;
}) {
  return (
    <article
      className="relative flex flex-col gap-2 border p-4"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <span
        className="absolute right-0 top-0 h-0 w-0"
        style={{
          borderStyle: 'solid',
          borderWidth: '0 22px 22px 0',
          borderColor: `transparent var(--rarity-${item.rarity}) transparent transparent`,
        }}
      />

      {item.modification?.kind === 'completa' && (
        <button
          type="button"
          aria-label={`Ver anotação do mestre sobre ${item.name}`}
          onClick={() => onOpenModification(item)}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-xs"
          style={{ background: 'var(--seal)', color: 'var(--surface)' }}
        >
          ✦
        </button>
      )}
      {item.modification?.kind === 'simples' && (
        <span
          title="Atributos ajustados pelo mestre"
          className="absolute right-2 top-2 text-xs"
          style={{ color: 'var(--ink-muted)' }}
        >
          ✦
        </span>
      )}

      <div className="flex items-baseline justify-between text-xs">
        <span style={{ color: 'var(--ink-muted)' }}>
          {item.categories.map((c) => CATEGORY_LABEL[c]).join(', ')}
        </span>
        <span style={{ color: `var(--rarity-${item.rarity})` }}>
          {RARITY_LABEL[item.rarity]}
        </span>
      </div>

      <h3 className="text-xl" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
        {item.name}
      </h3>

      <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
        {item.type}
        {item.attun ? ' · Sintonia' : ''}
      </p>

      <div className="mt-auto flex items-end justify-between gap-2 border-t pt-2" style={{ borderColor: 'var(--border)' }}>
        <Coins priceGp={item.priceGp} mode={currency} />
      </div>

      {item.source && (
        <p className="text-right text-xs italic" style={{ color: 'var(--ink-muted)' }}>
          Proveniência: {item.source}
        </p>
      )}
    </article>
  );
}
```

- [ ] **Step 5: Verificar manualmente**

Run: `npm run dev`
Expected: preços aparecem quebrados em pp/po/pr/pc com cores próprias; clicar no
alternador recalcula todos os cards na hora.

- [ ] **Step 6: Commit**

```bash
git add components/Coins.tsx components/CurrencyToggle.tsx components/ItemCard.tsx components/CatalogExplorer.tsx
git commit -m "feat: wire currency toggle and coin breakdown into catalog"
```

---

## Task 11: Endpoint de revalidação manual

**Files:**
- Create: `app/api/revalidate/route.ts`

**Interfaces:**
- Consumes: `REVALIDATE_SECRET` (env var, ver Task 5)
- Produces: rota `GET /api/revalidate?secret=...`

- [ ] **Step 1: Implementar a rota**

Crie `app/api/revalidate/route.ts`:

```typescript
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const expected = process.env.REVALIDATE_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false, error: 'Segredo inválido.' }, { status: 401 });
  }

  revalidatePath('/');
  return NextResponse.json({ ok: true, revalidated: true, now: Date.now() });
}
```

- [ ] **Step 2: Verificar manualmente**

Com `.env.local` contendo `REVALIDATE_SECRET=teste123` e o servidor rodando:

Run: abra `http://localhost:3000/api/revalidate?secret=teste123` no navegador
Expected: resposta JSON `{"ok":true,"revalidated":true,"now":...}`.

Run: abra `http://localhost:3000/api/revalidate?secret=errado`
Expected: resposta `401` com `{"ok":false,"error":"Segredo inválido."}`.

- [ ] **Step 3: Commit**

```bash
git add app/api/revalidate/route.ts
git commit -m "feat: add manual revalidation endpoint"
```

---

## Task 12: Deploy na Vercel

**Files:**
- Nenhum arquivo de código — checklist de configuração externa.

- [ ] **Step 1: Compartilhar a planilha com a conta de serviço**

No Google Sheets, compartilhe a planilha (botão "Compartilhar") com o email da conta de
serviço (`GOOGLE_SERVICE_ACCOUNT_EMAIL`) como **Leitor**. Sem isso, `fetchCatalog()`
recebe erro de permissão.

- [ ] **Step 2: Criar o projeto na Vercel**

```bash
npx vercel link
```

Siga o prompt interativo (escolha o escopo/conta e confirme o nome do projeto).

- [ ] **Step 3: Configurar as variáveis de ambiente na Vercel**

Para cada uma — `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`,
`GOOGLE_SHEETS_SPREADSHEET_ID`, `REVALIDATE_SECRET` — rode:

```bash
npx vercel env add NOME_DA_VARIAVEL production
```

Cole o valor quando solicitado. Para `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, cole a chave
com as quebras de linha como `\n` literais (igual ao `.env.example`).

- [ ] **Step 4: Deploy**

```bash
npx vercel --prod
```

Expected: build passa (`npm run build` roda internamente), URL de produção retornada no
final.

- [ ] **Step 5: Verificar em produção**

Abra a URL retornada. Expected: catálogo carrega com os itens reais, busca/filtros/tema/
moeda funcionando. Teste o endpoint `/api/revalidate?secret=<seu-segredo>` também em
produção.

- [ ] **Step 6: Commit (se algum arquivo de config da Vercel foi gerado)**

```bash
git status
git add -A
git commit -m "chore: link Vercel project" # só se `vercel link` criou .vercel/ e você quer rastrear vercel.json, se houver
```

`.vercel/` normalmente já vem no `.gitignore` padrão do Next.js — confirme antes de dar
`git add -A`.

---

## Self-review

**Cobertura do spec:**
- §3.1/3.2 (schema e migração) → já aplicado na planilha antes deste plano; Tasks 2–3
  leem exatamente esse schema.
- §3.3 (JSON, Rating nunca sai) → Task 2, testado explicitamente.
- §3.4 (validações) → Task 3.
- §4 (ISR 5min + revalidação manual) → Tasks 7 e 11.
- §5 (MVP: busca, filtros, selo/modal, sem modo mestre) → Tasks 7 e 9.
- §6 (moeda) → Task 4 (lógica) e Task 10 (UI).
- §7 (visual) → Task 8.
- §8 (stack) → Task 1, 5.
- §9 (ordem de construção) → ordem das tasks segue a mesma sequência.

**Consistência de tipos:** `CatalogItem`, `RaritySlug`, `CategorySlug` definidos na Task
2 e usados sem alteração de nome em todas as tasks seguintes. `CoinBreakdown`/
`CurrencyMode` definidos na Task 4, usados sem alteração nas Tasks 10. Nenhuma
divergência de assinatura encontrada.

**Decisão de implementação não coberta explicitamente pela spec:** o tratamento
diferenciado de `Tipo de modificação = Simples` (selo informativo, sem modal, já que o
MD original não exige texto do mestre para esse caso) vs. `Completa` (selo clicável com
modal). Sinalizado nas Tasks 9 — revisar com o usuário se o comportamento não for o
esperado.
