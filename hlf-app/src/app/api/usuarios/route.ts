/* 
    Este archivo contiene el enpoint para registrar un nuevo usuario.
*/

import { NextRequest, NextResponse } from 'next/server';
import { registrarUsuario } from '@/services/usuario.service';
import { verificarFirma } from '../../utils/verificarFirma';

// Este api endpoint se utiliza para registrar un nuevo usuario en la blockchain.
export async function POST(req: NextRequest) {
  // Obtenemos el cuerpo de la solicitud
  const body = await req.json();
  // Obtenemos los parámetros del cuerpo
  const { nombre, metamaskAddress, rol, message, signature } = body;

  // Verificamos la firma
  if (!verificarFirma(message, signature, metamaskAddress)) {
    // Si la firma es inválida, retornamos un error
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
  }

  // Intentamos registrar el usuario
  try {
    const result = await registrarUsuario(nombre, metamaskAddress, rol);
    // Retornamos el resultado
    return NextResponse.json({ result });
  } catch (err: unknown) {
    // Si ocurre un error, retornamos un error 500
    let errorMessage = 'Unknown error';
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}