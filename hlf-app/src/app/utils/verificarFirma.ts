// utils/verificarFirma.ts
import { verifyMessage } from 'ethers';

// Toma un address y un mensaje como parámetro y retorna un valor booleano si el address es el que firma el mensaje
export function verificarFirma(message: string, signature: string, expectedAddress: string): boolean {
  try {
    // Obtenemos el address que firmo el mensaje
    const recovered = verifyMessage(message, signature);
    // Comparamos el address obtenido con el address esperado y retornamos el resultado
    return recovered.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.log(error);
    throw error;
  }
}