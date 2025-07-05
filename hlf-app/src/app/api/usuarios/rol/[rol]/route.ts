// app/api/usuarios/rol/[rol]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { listarUsuariosPorRol } from '@/services/usuario.service';
import { verificarFirma } from '../../../../utils/verificarFirma';

// Listar usuarios por rol
export async function POST(req: NextRequest, { params }: { params: { rol: string } }) {
  // Obtenemos el cuerpo de la solicitud
  const body = await req.json();
  // Obtenemos los parámetros del cuerpo
  const { message, signature, address } = body;

  // Verificamos la firma
  if (!verificarFirma(message, signature, address)) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
  }

  try {
    // Listamos los usuarios por rol
    const usuarios = await listarUsuariosPorRol(params.rol, address);
    // Retornamos los usuarios
    return NextResponse.json(usuarios);
  } catch (err: unknown) {
    // Si ocurre un error, retornamos un error 500
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}