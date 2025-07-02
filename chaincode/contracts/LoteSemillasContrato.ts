/*
  Formato LoteSemillas Key: AgricultorMetamaskAddress/lote/variedad/fechaCompra
*/

import {
  Contract,
  Context,
  Returns,
  Info,
  Transaction,
} from "fabric-contract-api";
import { ICondicionesSiembra, LoteSemillas } from "../assets/LoteSemillas";
import { ICondicionesAlmacenamiento } from "../assets/LoteSemillas";
import stringify from "json-stringify-deterministic";
import sortKeysRecursive from "sort-keys-recursive";

@Info({
  title: "LoteSemillasContrato",
  description:
    "Contrato para manejar todas las transacciones relacionadas con el asset loteSemillas",
})
export default class LoteSemillasContrato extends Contract {
  // Función para verificar si el usuario es un agricultor
  private verificarAgricultor(ctx: Context): void {
    // Verificar rol del usuario
    const role = ctx.clientIdentity.getAttributeValue("role");
    if (role !== "agricultor") {
      throw new Error(
        'Solo los usuarios con rol "agricultor" pueden ejecutar esta transacción.'
      );
    }
  }

  private validarNoVacio(nombre: string, valor: string) {
    if (!valor || valor.trim() === "") {
      throw new Error(
        `${nombre} no puede estar vacío ni contener solo espacios.`
      );
    }
  }

  // Transacción para almacenar un nuevo lote de semillas
  // Esta transacción crea un nuevo asset LoteSemillas con los parámetros recibidos y lo garda eb el WorldState.
  @Transaction()
  @Returns("string")
  public async almacenarLoteSemillas(
    ctx: Context,
    lote: string,
    variedad: string,
    fechaCompra: string,
    toneladas: number,
    condicionesAlmacenamiento: ICondicionesAlmacenamiento
  ): Promise<LoteSemillas> {
    // Verificar que el usuario que llama a la transacción es un agricultor
    this.verificarAgricultor(ctx);

    // Verificar que los parámetros sean validos
    this.validarNoVacio("Lote", lote);
    this.validarNoVacio("Variedad", variedad);
    this.validarNoVacio("Fecha de compra", fechaCompra);
    if (toneladas <= 0) {
      throw new Error("Las toneladas deben ser un número positivo mayor a 0.");
    }
    // Obtenemos el key del agricultor desde el contexto
    const agricultor = ctx.clientIdentity.getAttributeValue(
      "metamaskAddress"
    ) as string;

    // Contruimos el key del asset con los parámetros recibidos
    // Nota: El Key es una cadena única que identifica el asset en el WorldState.
    const key = ctx.stub.createCompositeKey("LoteSemillas", [
      agricultor,
      lote,
      variedad,
      fechaCompra,
    ]);

    // Verificamos si el asset ya existe en el WorldState
    // Si el asset ya existe, lanzamos un error
    const loteSemillasJSON = await ctx.stub.getState(key);
    const exists = loteSemillasJSON.length > 0;
    if (exists) {
      throw new Error(`El asset ${key} ya exíste.`);
    }

    // Creamos el asset LoteSemillas con los parámetros recibidos
    const loteSemillasAsset: LoteSemillas = {
      lote: lote,
      agricultor: agricultor,
      variedad: variedad,
      toneladas: toneladas,
      fechaCompra: fechaCompra,
      estado: "almacenado",
      condicionesAlmacenamiento: condicionesAlmacenamiento,
    };

    // Guardamos el asset LoteSemillas en el WorldState
    await ctx.stub.putState(
      key,
      Buffer.from(stringify(sortKeysRecursive(loteSemillasAsset)))
    );
    return loteSemillasAsset;
  }

  // Transacción para sembrar un lote de semillas
  // Esta transacción actualiza el estado del asset LoteSemillas a "sembrado" y guarda las condiciones de siembra.
  @Transaction()
  @Returns("LoteSemillas")
  public async sembrarLoteSemillas(
    ctx: Context,
    lote: string,
    condicionesSiembra: ICondicionesSiembra
  ): Promise<LoteSemillas> {
    // Verifica que quien ejecuta la transacción es un agricultor
    this.verificarAgricultor(ctx);
    const agricultor = ctx.clientIdentity.getAttributeValue(
      "metamaskAddress"
    ) as string;

    const { asset, key } = await this.obtenerLote(ctx, lote);
    const compositeKey = key;
    const loteSemillas = asset;
    // Verificamos que el agricultor sea el dueño del lote
    if (loteSemillas.agricultor !== agricultor) {
      throw new Error(
        `El agricultor ${agricultor} no es dueño del lote ${lote}.`
      );
    }

    // Validamos que aún esté en estado almacenado
    if (loteSemillas.estado !== "almacenado") {
      throw new Error(
        `El lote ${lote} ya fue sembrado o no está disponible para siembra.`
      );
    }


    // Creamos el nuevo estado del asset
    const updatedLoteSemillas: LoteSemillas = {
      ...loteSemillas,
      estado: "sembrado",
      condicionesSiembra: condicionesSiembra,
    };

    // Guardamos en el world state
    await ctx.stub.putState(
      compositeKey,
      Buffer.from(stringify(sortKeysRecursive(updatedLoteSemillas)))
    );

    return updatedLoteSemillas;
  }

  // Transacción para leer un lote de semillas
  // Esta transacción obtiene un asset LoteSemillas del WorldState usando el lote especificado.
  @Transaction()
  @Returns("string")
  public async leerLoteSemillas(
    ctx: Context,
    agricultorAddress: string,
    lote: string
  ): Promise<{ asset: LoteSemillas; key: string }> {
    // Verificar que el usuario que llama a la transacción es un agricultor o un admin
    const role = ctx.clientIdentity.getAttributeValue("role");
    const address = ctx.clientIdentity.getAttributeValue("metamaskAddress");
    if (address !== agricultorAddress && role !== "admin") {
      throw new Error(
        "No tienes permisos para leer el lote de semillas de este agricultor. Solo el agricultor o un administrador pueden realizar esta acción."
      );
    }

    const loteSemillas = this.obtenerLote(ctx, lote);

    return loteSemillas;
  }

  @Transaction()
  @Returns("any[]")
  public async listarLotesDelAgricultor(
    ctx: Context,
    agricultorAddress: string,
    variedad?: string
  ): Promise<LoteSemillas[]> {
    // Verificar que el usuario que llama a la transacción es un agricultor o un admin
    const role = ctx.clientIdentity.getAttributeValue("role");
    // Obtener la dirección del usuario desde el contexto
    const address = ctx.clientIdentity.getAttributeValue("metamaskAddress");
    if (!address) {
      throw new Error(
        "No se pudo obtener la dirección del usuario desde el contexto."
      );
    }
    if (address !== agricultorAddress && role !== "admin") {
      throw new Error(
        "No tienes permisos para listar los lotes de semillas de este agricultor. Solo el agricultor o un administrador pueden realizar esta acción."
      );
    }
    // Obtener el iterador con el composite key parcial para listar los lotes del agricultor
    // Si se especifica una variedad, solo se listarán los lotes de esa variedad
    const resultados: any[] = [];
    const iterator = await ctx.stub.getStateByPartialCompositeKey(
      "LoteSemillas",
      [address]
    );

    while (true) {
      const res = await iterator.next();
      if (res.value && res.value.value.toString()) {
        // Parseamos el valor del asset LoteSemillas
        // El valor es un Buffer, lo convertimos a string y luego a objeto JSON
        const loteStr = res.value.value.toString();
        const lote = JSON.parse(loteStr);
        // Si no se especifica variedad o la variedad del lote coincide con la variedad especificada, lo agregamos a los resultados
        // Esto permite filtrar los lotes por variedad si se especifica
        if (!variedad || lote.variedad === variedad) {
          resultados.push(lote);
        }
      }
      // Si el iterador ha terminado, cerramos el iterador y salimos del bucle
      if (res.done) {
        await iterator.close();
        break;
      }
    }

    return resultados;
  }

  private async obtenerLote(
    ctx: Context,
    lote: string
  ): Promise<{ asset: LoteSemillas; key: string }> {
    const iterator = await ctx.stub.getStateByPartialCompositeKey(
      "LoteSemillas",
      []
    );
    while (true) {
      const res = await iterator.next();
      if (res.value && res.value.value) {
        const asset = JSON.parse(res.value.value.toString()) as LoteSemillas;
        if (asset.lote === lote) {
          await iterator.close();
          return { asset, key: res.value.key };
        }
      }
      if (res.done) {
        await iterator.close();
        break;
      }
    }
    throw new Error(`LoteSemillas con lote ${lote} no encontrado.`);
  }
}
