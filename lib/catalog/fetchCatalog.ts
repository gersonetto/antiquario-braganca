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
