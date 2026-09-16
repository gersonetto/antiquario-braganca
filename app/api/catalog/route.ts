import { NextResponse } from 'next/server';
import { fetchCatalog } from '@/lib/catalog/fetchCatalog';

export const revalidate = 300;

export async function GET() {
  const items = await fetchCatalog();
  const publicItems = items.map(({ rd: _rd, ...item }) => item);

  return NextResponse.json(publicItems, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
