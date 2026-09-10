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
