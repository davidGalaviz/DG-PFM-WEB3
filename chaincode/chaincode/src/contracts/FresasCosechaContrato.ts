// File: chaincode/contracts/FresasCosechaContrato.ts
/*
  Formato FresasCosecha Key: “cosechaFresas”/propietarioAddress/variedad/cosechaID/loteSemillasKey
*/

// Importamos las dependencias necesarias de Hyperledger Fabric
import {
  Contract,
  Context,
  Info,
  Returns,
  Transaction,
} from "fabric-contract-api";
import stringify from "json-stringify-deterministic";
import sortKeysRecursive from "sort-keys-recursive";
import { FresasCosecha } from "../assets/FresasCosecha";
import { LoteSemillas } from "../assets/LoteSemillas";

@Info({
  title: "FresasCosechaContrato",
  description: "Contrato para la gestión de fresas cosechadas a granel",
})
export class FresasCosechaContrato extends Contract {
  // 🔨 Funciones auxiliares
  // Función para construir la clave de la cosecha de fresas
  private construirClaveFresasCosecha(
    ctx: Context,
    propietario: string,
    variedad: string,
    cosechaID: string,
    loteSemillasKey: string
  ): string {
    return ctx.stub.createCompositeKey("cosechaFresas", [
      propietario,
      variedad,
      cosechaID,
      loteSemillasKey,
    ]);
  }
  // Función para validar que un campo no este vacio
  private validarNoVacio(nombre: string, valor: string): void {
    if (!valor || valor.trim() === "") {
      throw new Error(
        `${nombre} no puede estar vacío ni contener solo espacios.`
      );
    }
  }

  // 🍓 Transacción para cosechar fresas
  @Transaction()
  @Returns("FresasCosecha")
  public async cosecharFresas(
    ctx: Context,
    keyLoteSemillas: string,
    cosechaID: string,
    cantidadKilos: number,
    condicionesRecoleccion: string,
    tempDuranteCosecha: number
  ): Promise<FresasCosecha> {
    // Validar los parámetros
    this.validarNoVacio("idLoteSemillas", keyLoteSemillas);
    this.validarNoVacio("cosechaID", cosechaID);
    this.validarNoVacio("condicionesRecoleccion", condicionesRecoleccion);
    // Validar que la cantidad de kilos sea un número positivo
    if (cantidadKilos <= 0) {
      throw new Error("La cantidad de kilos debe ser un número positivo.");
    }
    // Validar que la temperatura durante la cosecha sea un número positivo
    if (tempDuranteCosecha <= 0) {
      throw new Error(
        "La temperatura durante la cosecha debe ser un número positivo."
      );
    }

    // Leer el lote de semillas con el key proporcionado
    const loteBuffer = await ctx.stub.getState(keyLoteSemillas);
    // Si el lote no se encontró, lanzar un error
    if (!loteBuffer || loteBuffer.length === 0) {
      throw new Error(`Lote de semillas ${keyLoteSemillas} no encontrado.`);
    }
    // Parsear el lote de semillas a JSON
    const loteSemillas: LoteSemillas = JSON.parse(loteBuffer.toString());
    // Obtener la variedad del lote
    const variedad = loteSemillas.variedad;

    // Verificar que el usuario que llama a la transacción sea un responsable de cosecha
    if (ctx.clientIdentity.getAttributeValue("role") !== "responsableCosecha") {
      // Si no es un responsable de cosecha, lanzar un error
      throw new Error(
        "Solo un responsable de cosecha puede cosechar las fresas."
      );
    }

    // Verificar que el estado del lote de semillas sea "sembrado"
    if (loteSemillas.estado !== "sembrado") {
      // Si el estado del lote de semillas no es "sembrado", lanzar un error
      throw new Error(
        `El lote no está listo para cosecha. Estado actual: ${loteSemillas.estado}`
      );
    }

    // Obtener el address del agricultor propietario del lote a cosechar
    const propietario = loteSemillas.propietarioAddress;

    // Obtener las fecha actual y la clave de la cosecha (timestamp actuál)
    const fechaCosecha = new Date().toISOString();
    // Construir la clave de la cosecha
    const keyFresas = this.construirClaveFresasCosecha(
      ctx,
      propietario,
      variedad,
      cosechaID,
      keyLoteSemillas
    );

    // Construir el asset de cosecha de fresas
    const fresasCosecha: FresasCosecha = {
      cosechaID,
      idLoteSemillas: keyLoteSemillas,
      propietario,
      variedad,
      kilosTotales: cantidadKilos,
      kilosAunNoCosechados: cantidadKilos,
      fechaCosecha,
      responsableCosecha: propietario,
      condicionesRecoleccion,
      tempDuranteCosecha,
    };

    // Guardar la cosecha de fresas en el WorldState
    await ctx.stub.putState(
      keyFresas,
      Buffer.from(stringify(sortKeysRecursive(fresasCosecha)))
    );

    // Cambiar estado del lote de semillas a "cosechado"
    const loteSemillasActualizado = {
      ...loteSemillas,
      estado: "cosechado",
    };
    // Guardar el lote de semillas actualizado en el WorldState
    await ctx.stub.putState(
      keyLoteSemillas,
      Buffer.from(stringify(sortKeysRecursive(loteSemillasActualizado)))
    );
    // Devolver un mensaje de confirmación
    return fresasCosecha as FresasCosecha;
  }

  // 🧪 Verifica si el asset ya existe
  @Transaction(false)
  @Returns("boolean")
  public async existeFresasCosecha(
    ctx: Context,
    key: string
  ): Promise<boolean> {
    // Obtener el asset de la clave proporcionada
    const buffer = await ctx.stub.getState(key);
    // Devolver true si el asset existe, false si no
    return !!(buffer && buffer.length > 0);
  }

  // 🔍 Leer un asset FresasGranel
  @Transaction(false)
  @Returns("FresasCosecha")
  public async leerFresasCosecha(
    ctx: Context,
    key: string
  ): Promise<FresasCosecha> {
    // Obtener el asset de la clave proporcionada
    const buffer = await ctx.stub.getState(key);
    // Si el asset no se encontró, lanzar un error
    if (!buffer || buffer.length === 0) {
      throw new Error(`FresasGranel con clave ${key} no encontradas.`);
    }
    // Devolver el asset si existe
    return JSON.parse(buffer.toString()) as FresasCosecha;
  }

  // 📋 Listar todas las cosechas de fresas de un agricultor
  @Transaction(false)
  @Returns("FresasCosecha[]")
  public async listarCosechasPorAgricultor(
    ctx: Context,
    propietario: string
  ): Promise<FresasCosecha[]> {
    // Obtener el rol y el address del caller
    const caller = ctx.clientIdentity.getAttributeValue("metamaskAddress");
    const rol = ctx.clientIdentity.getAttributeValue("role");

    // Verificar si el caller es un admin o el agricultor propietario
    const esAdmin = rol === "admin";
    const esPropietario = caller === propietario;
    // Si el caller no es un admin o el agricultor propietario, lanzar un error
    if (!esAdmin && !esPropietario) {
      throw new Error(
        "Solo un admin o el agricultor propietario puede ver estas cosechas de fresas."
      );
    }

    // Obtener un iterador de las cosechas de fresas del agricultor
    const iterator = await ctx.stub.getStateByPartialCompositeKey(
      "cosechaFresas",
      [propietario]
    );
    // Crear un array para almacenar los resultados
    const results: FresasCosecha[] = [];

    while (true) {
      const res = await iterator.next();
      if (res.value && res.value.value && res.value.value.length > 0) {
        // Parsear el valor del asset a un objeto
        const asset: FresasCosecha = JSON.parse(res.value.value.toString());
        // Si el agricultor propietario coincide con el especificado en los parámetros, agregar el asset al array
        if (asset.propietario === propietario) {
          results.push(asset);
        }
      }
      // Si el iterador se ha recorrido hasta el final, cerrarlo
      if (res.done) {
        await iterator.close();
        break;
      }
    }

    return results as FresasCosecha[];
  }
}
