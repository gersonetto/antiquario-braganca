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
