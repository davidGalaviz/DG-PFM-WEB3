import {
  Contract,
  Context,
  Info,
  Transaction,
  Returns,
} from "fabric-contract-api";
import { FresasGranel } from "../assets/FresasGranel";

interface IDatosCosecha {
  /**
   * LoteSemillas:Lote:Variedad:FechaCompra:Agricultor
   */
  idLoteSemillas: string;
  toneladas: number;
  fechaCosecha: string;
  responsableCosecha: string;
  condicionesRecoleccion: string;
  tempDuranteCosecha: number;
}

@Info({
  title: "FresasGranelContrato",
  description:
    "Este contrato contiene todas las transacciones relacionadas con el asset Fresas a Granel",
})
export default class FresasGranelContrato extends Contract {
  @Transaction()
  @Returns("string")
  public async CosecharFresas(
    ctx: Context,
    idLoteSemillas: string,
    toneladas: number,
    fechaCosecha: string,
    responsableCosecha: string,
    condicionesRecoleccion: string,
    tempDuranteCosecha: number,
  ): Promise<string | null> {
    // Revisamos que no se haya registrado esta cosecha previamente
    const cosechaDuplicada = await ctx.stub.getState(
      `Granel:${idLoteSemillas}:${fechaCosecha}`
    );

    if (cosechaDuplicada.length > 0) {
      // Si se encontró una cosecha duplicada, devolvemos null.
      return null;
    }

    // Revisamos que el lote especificado sí exista
    const lote = await ctx.stub.getState(idLoteSemillas);

    if (lote.length === 0) {
      // Si no se encontró el lote, esta no es una operación válida.
      throw new Error(
        `El Lote de Semillas con ID ${idLoteSemillas} no existe.`
      );
    }

    // Tomamos la variedad del ID del Lote.
    const variedad = idLoteSemillas.split(":")[2];

    // Creamos un asset "Fresas a Granel", con los datos que recibimos
    const fresasGranelAsset: FresasGranel = {
      idLoteSemillas: idLoteSemillas,
      fechaCosecha: fechaCosecha,
      variedad: variedad,
      toneladas: toneladas,
      responsableCosecha: responsableCosecha,
      condicionesRecoleccion: condicionesRecoleccion,
      tempDuranteCosecha: tempDuranteCosecha
    }


    await ctx.stub.putState(
      `Granel:${fresasGranelAsset.idLoteSemillas}:${fresasGranelAsset.fechaCosecha}`,
      Buffer.from(JSON.stringify(fresasGranelAsset))
    );

    return JSON.stringify(fresasGranelAsset);
  }

  @Transaction(false)
  @Returns("string")
  public async LeerFresas(ctx: Context, id: string): Promise<string> {
    const assetJSON = await ctx.stub.getState(id);
    if (assetJSON.length === 0) {
      throw new Error(`El asset Fresa a Granel con ID ${id} no existe.`);
    }
    return JSON.stringify(assetJSON);
  }
}
