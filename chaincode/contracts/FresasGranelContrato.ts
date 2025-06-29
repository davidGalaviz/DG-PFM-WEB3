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
    datosCosecha: IDatosCosecha
  ): Promise<string | null> {
    // Revisamos que no se haya registrado esta cosecha previamente
    const cosechaDuplicada = await ctx.stub.getState(
      `Granel:${datosCosecha.idLoteSemillas}:${datosCosecha.fechaCosecha}`
    );

    if (cosechaDuplicada.length > 0) {
      // Si se encontró una cosecha duplicada, devolvemos null.
      return null;
    }

    // Revisamos que el lote especificado sí exista
    const lote = await ctx.stub.getState(datosCosecha.idLoteSemillas);

    if (lote.length === 0) {
      // Si no se encontró el lote, esta no es una operación válida.
      throw new Error(
        `El Lote de Semillas con ID ${datosCosecha.idLoteSemillas} no existe.`
      );
    }

    const asset = new FresasGranel();
    // Tomamos la variedad del ID del Lote.
    const variedad = datosCosecha.idLoteSemillas.split(":")[2];

    // Creamos un asset "Fresas a Granel", con los datos que recibimos
    asset.idLoteSemillas = datosCosecha.idLoteSemillas;
    asset.toneladas = datosCosecha.toneladas;
    asset.variedad = variedad;
    asset.fechaCosecha = datosCosecha.fechaCosecha;
    asset.responsableCosecha = datosCosecha.responsableCosecha;
    asset.condicionesRecoleccion = datosCosecha.condicionesRecoleccion;
    asset.tempDuranteCosecha = datosCosecha.tempDuranteCosecha;

    await ctx.stub.putState(
      `Granel:${asset.idLoteSemillas}:${asset.fechaCosecha}`,
      Buffer.from(JSON.stringify(asset))
    );

    return JSON.stringify(asset);
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
