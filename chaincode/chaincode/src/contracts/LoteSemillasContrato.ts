// File: chaincode/contracts/LoteSemillasContrato.ts
/*
  Formato LoteSemillas Key: “loteSemillas”/propietario/variedad/lote
*/

// Importamos las dependencias necesarias de Hyperledger Fabric
import {
  Contract,
  Context,
  Returns,
  Info,
  Transaction,
} from "fabric-contract-api";
import { CondicionesSiembra, LoteSemillas, CondicionesAlmacenamiento } from "../assets/LoteSemillas";
import stringify from "json-stringify-deterministic";
import sortKeysRecursive from "sort-keys-recursive";

@Info({
  title: "LoteSemillasContrato",
  description: "Contrato para manejar todas las transacciones relacionadas con el asset loteSemillas",
})
export class LoteSemillasContrato extends Contract {
  // 🔨 Funciones auxiliares
  // Función para verificar si el usuario es un agricultor
  private verificarAgricultor(ctx: Context): void {
    const role = ctx.clientIdentity.getAttributeValue("role");
    if (role !== "agricultor") {
      throw new Error('Solo los usuarios con rol "agricultor" pueden ejecutar esta transacción.');
    }
  }

  // Función para validar que un campo no este vacio
  private validarNoVacio(nombre: string, valor: string): void {
    if (!valor || valor.trim() === "") {
      throw new Error(`${nombre} no puede estar vacío ni contener solo espacios.`);
    }
  }

  // Función para construir la clave del lote de semillas
  private construirClaveLoteSemillas(
    ctx: Context,
    propietario: string,
    variedad: string,
    lote: string
  ): string {
    return ctx.stub.createCompositeKey("loteSemillas", [propietario, variedad, lote]);
  }

  // 📦 Función para almacenar un lote de semillas (registrar un nuevo lote de semillas)
  @Transaction()
  @Returns("LoteSemillas")
  public async almacenarLoteSemillas(
    ctx: Context,
    lote: string,
    variedad: string,
    toneladas: number,
    condicionesAlmacenamiento: CondicionesAlmacenamiento
  ): Promise<LoteSemillas> {
    // Verificar que el usuario es un agricultor
    this.verificarAgricultor(ctx);
    // Validar que los campos no esten vacios
    this.validarNoVacio("Lote", lote);
    this.validarNoVacio("Variedad", variedad);

    // Validar que las toneladas sean un número positivo
    if (toneladas <= 0) {
      throw new Error("Las toneladas deben ser un número positivo mayor a 0.");
    }

    // Obtener el address del agricultor que llama a la transacción
    const propietario = ctx.clientIdentity.getAttributeValue("metamaskAddress") as string;
    // Construir la clave del lote
    const key = this.construirClaveLoteSemillas(ctx, propietario, variedad, lote);

    // Verificar si el lote ya existe
    const exists = (await ctx.stub.getState(key)).length > 0;
    if (exists) {
      // Si el lote ya existe, lanzar un error
      throw new Error(`El lote ${lote} para variedad ${variedad} ya existe.`);
    }

    // Obtener la fecha de compra (timestamp actual)
    const fechaCompra = new Date().toISOString(); // 📅 Asignación automática

    // Construir el asset del lote
    const asset: LoteSemillas = {
      lote,
      variedad,
      fechaCompra,
      toneladas,
      estado: "almacenado",
      propietarioAddress: propietario,
      condicionesAlmacenamiento,
    };

    // Guardar el asset en el WorldState
    await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(asset))));
    // Devolver el asset
    return asset;
  }

  // 🌱 Función para sembrar un lote de semillas
  @Transaction()
  @Returns("LoteSemillas")
  public async sembrarLoteSemillas(
    ctx: Context,
    variedad: string,
    lote: string,
    condicionesSiembra: CondicionesSiembra
  ): Promise<LoteSemillas> {
    // Verificar que el usuario es un agricultor
    this.verificarAgricultor(ctx);
    // Obtener el address del agricultor que llama a la transacción
    const propietario = ctx.clientIdentity.getAttributeValue("metamaskAddress") as string;

    // Construir la clave del lote
    const key = this.construirClaveLoteSemillas(ctx, propietario, variedad, lote);
    // Obtener el asset del lote
    const data = await ctx.stub.getState(key);

    // Si el lote no existe, lanzar un error
    if (!data || data.length === 0) {
      throw new Error(`El lote ${lote} no existe para la variedad ${variedad}.`);
    }

    // Parsear al asset a JSON
    const asset = JSON.parse(data.toString()) as LoteSemillas;

    // Si el propietario del asset no es el que esta llamando la transacción lanzar un error
    if (asset.propietarioAddress !== propietario) {
      throw new Error(`El agricultor ${propietario} no es dueño del lote ${lote}.`);
    }

    // Si el estado del asset es diferente a "almacenado" lanzar un error
    if (asset.estado !== "almacenado") {
      throw new Error(`El lote ${lote} ya fue sembrado o no está disponible para siembra.`);
    }

    // Crear el asset actualizado
    const updatedAsset: LoteSemillas = {
      ...asset,
      estado: "sembrado",
      condicionesSiembra,
    };
    // Guardar el asset actualizado en el WorldState
    await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
    // Devolver el asset actualizado
    return updatedAsset;
  }

  // 📖 Función para leer un lote de semillas
  @Transaction()
  @Returns("LoteSemillas")
  public async leerLoteSemillas(
    ctx: Context,
    propietario: string,
    variedad: string,
    lote: string
  ): Promise<LoteSemillas> {
    // Construir la clave del lote
    const key = this.construirClaveLoteSemillas(ctx, propietario, variedad, lote);
    // Obtener el asset del lote
    const data = await ctx.stub.getState(key);
    // Si el lote no existe, lanzar un error
    if (!data || data.length === 0) {
      throw new Error(`No se encontró el lote ${lote}.`);
    }
    // Devolver el asset si existe
    return JSON.parse(data.toString()) as LoteSemillas;
  }

  // 📋 Función para listar los lotes de semillas de un agricultor
  @Transaction()
  @Returns("LoteSemillas[]")
  public async listarLotesDelAgricultor(
    ctx: Context,
    agricultorPropietario: string,
    variedad?: string
  ): Promise<LoteSemillas[]> {
    // Obtener el address del usuario que llama a la transacción
    const callerAddress = ctx.clientIdentity.getAttributeValue("metamaskAddress");
    // Obtener el rol del usuario
    const role = ctx.clientIdentity.getAttributeValue("role");

    // Si el usuario que llama a la transacción no es el agricultor del que se quiere listar y no es admin, lanzar un error
    if (callerAddress !== agricultorPropietario && role !== "admin") {
      throw new Error("No tienes permisos para listar estos lotes.");
    }

    // Construir la clave parcial del lote para busqueda
    // Si se proporciona una variedad, se busca por agricultor y variedad
    // Si no se proporciona una variedad, se busca solo por agricultor
    const partialKey = variedad
      ? [agricultorPropietario, variedad]
      : [agricultorPropietario];

    // Obtener un iterador de los lotes de semillas del agricultor
    const iterator = await ctx.stub.getStateByPartialCompositeKey("loteSemillas", partialKey);
    // Crear un array para almacenar los lotes
    const resultados: LoteSemillas[] = [];

    // Recorrer el iterador y agregar los lotes al array
    while (true) {
      const res = await iterator.next();
      if (res.value && res.value.value) {
        // Parsear el valor del lote a un objeto
        const lote = JSON.parse(res.value.value.toString()) as LoteSemillas;
        // Agregar el lote al array
        resultados.push(lote);
      }
      if (res.done) {
        // Si se llega al final del iterador, cerrarlo
        await iterator.close();
        break;
      }
    }
    // Si no se encontraron lotes de semillas para el agricultor, lanzar un error
    if (resultados.length === 0) {
      throw new Error(`No se encontraron lotes de semillas para el agricultor ${agricultorPropietario}.`);
    }
    // Si se encontraron lotes de semillas, devolverlos
    return resultados;
  }
}
