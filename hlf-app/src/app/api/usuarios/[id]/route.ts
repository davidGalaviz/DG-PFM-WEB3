import { NextRequest, NextResponse } from 'next/server';
import { eliminarUsuario, leerUsuario } from '@/services/usuario.service';
import { verificarFirma } from '../../../utils/verificarFirma';

// Este api endpoint se utiliza para eliminar un usuario de la blockchain.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { message, signature, address } = body;

  if (!verificarFirma(message, signature, address)) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
  }

  try {
    const result = await eliminarUsuario(params.id);
    return NextResponse.json({ result });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
// Este api endpoint se utiliza para obtener un usuario de la blockchain.
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const usuario = await leerUsuario(params.id);
    return NextResponse.json(usuario);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}