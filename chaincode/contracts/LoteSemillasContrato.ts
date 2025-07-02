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

  // Transacción para almacenar un nuevo lote de semillas
  // Esta transacción crea un nuevo asset LoteSemillas con los parámetros recibidos y lo garda eb el WorldState.
  @Transaction()
  @Returns("string")
  public async AlmacenarLoteSemillas(
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
    // Verificamos que los parámetros no sean strings vacias o string con espacios en blanco
    // Verificamos que las toneladas sean un número positivo mayoar a 0
    {
      if (lote.trim() === "") {
        throw new Error(
          "El lote no puede ser un string vacío o con espacios en blanco."
        );
      }
      if (variedad.trim() === "") {
        throw new Error(
          "La variedad no puede ser un string vacío o con espacios en blanco."
        );
      }
      if (fechaCompra.trim() === "") {
        throw new Error(
          "La fecha de compra no puede ser un string vacío o con espacios en blanco."
        );
      }
      if (toneladas <= 0) {
        throw new Error(
          "Las toneladas deben ser un número positivo mayor a 0."
        );
      }
    }
    // Obtenemos el key del agricultor desde el contexto
    const agricultor = ctx.clientIdentity.getAttributeValue(
      "metamaskAddress"
    ) as string;

    // Contruimos el key del asset con los parámetros recibidos
    // Nota: El Key es una cadena única que identifica el asset en el WorldState.
    const key = ctx.stub.createCompositeKey("LoteSemillas", [
      lote,
      variedad,
      fechaCompra,
      agricultor,
    ]);

    // Verificamos si el asset ya existe en el WorldState
    // Si el asset ya existe, lanzamos un error
    const exists = await this.LoteSemillasExists(ctx, key);
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
  public async SembrarLoteSemillas(
    ctx: Context,
    lote: string,
    condicionesSiembra: ICondicionesSiembra
  ): Promise<LoteSemillas> {

    // Verifica que quien ejecuta la transacción es un agricultor
    this.verificarAgricultor(ctx);

    // Obtener el iterador con el composite key parcial para validar que existe el LoteSemillas con el lote especificado
    const iterator = await ctx.stub.getStateByPartialCompositeKey(
      "loteSemillas",
      [lote]
    );
    const result = await iterator.next();
    // Si no hay resultados, significa que no existe un asset LoteSemillas con el lote especificado
    // Cerramos el iterador y lanzamos un error
    if (!result.value || !result.value.value) {
      await iterator.close();
      throw new Error(`El asset LoteSemillas con lote ${lote} no existe.`);
    }

    // Parseamos el valor del asset
    const loteSemillas = JSON.parse(
      result.value.value.toString()
    ) as LoteSemillas;

    // Validamos que aún esté en estado almacenado
    if (loteSemillas.estado !== "almacenado") {
      await iterator.close();
      throw new Error(
        `El lote ${lote} ya fue sembrado o no está disponible para siembra.`
      );
    }

    // Extraemos la composite key original del asset para hacer putState correctamente
    const compositeKey = result.value.key;

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

    await iterator.close();
    return updatedLoteSemillas;
  }

  // Transacción para leer un lote de semillas
  @Transaction()
  @Returns("string")
  public async LeerLoteSemillas(ctx: Context, lote: string): Promise<LoteSemillas> {
    // Obtener el iterador con el composite key parcial para validar que existe el LoteSemillas con el lote especificado
    const iterator = await ctx.stub.getStateByPartialCompositeKey(
      "loteSemillas",
      [lote]
    );
    const result = await iterator.next();
    // Si no hay resultados, significa que no existe un asset LoteSemillas con el lote especificado
    // Cerramos el iterador y lanzamos un error
    if (!result.value || !result.value.value) {
      await iterator.close();
      throw new Error(`El asset LoteSemillas con lote ${lote} no existe.`);
    }

    // Parseamos el valor del asset
    const loteSemillas = JSON.parse(
      result.value.value.toString()
    ) as LoteSemillas;

    return loteSemillas;
  }
    // LoteSemillasExists revisa si un LoteSemillas con el ID especificado existe en el WorldState.
  // Si el ID no comienza con "LoteSemillas", lanza un error.
  @Transaction(false)
  @Returns("boolean")
  public async LoteSemillasExists(ctx: Context, id: string): Promise<boolean> {
    if (id.split(":")[0] !== "LoteSemillas") {
      throw new Error("El asset que buscas no es un LoteSemillas.");
    }
    const loteSemillasJSON = await ctx.stub.getState(id);
    return loteSemillasJSON.length > 0;
  }
}
