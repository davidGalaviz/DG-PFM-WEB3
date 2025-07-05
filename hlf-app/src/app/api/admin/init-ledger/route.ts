import { NextRequest, NextResponse } from 'next/server';
import { initLedger } from '@/services/admin.service';
import { verificarFirma } from '../../../utils/verificarFirma';

// Este api endpoint se utiliza para inicializar la blockchain (Crear admin inicial).
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message, signature, address } = body;

  if (!verificarFirma(message, signature, address)) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
  }

  try {
    const result = await initLedger(address);
    return NextResponse.json({ result });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
