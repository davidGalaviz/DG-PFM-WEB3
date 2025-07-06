/*
  Formato LoteSemillas Key: AgricultorMetamaskAddress/lote/variedad/fechaCompra
*/
import { Object, Property } from "fabric-contract-api";

@Object()
export class CondicionesAlmacenamiento {
  @Property()
  public temperatura: number = 0;

  @Property()
  public humedad: number = 0;
}

@Object()
export class CondicionesSiembra {
  @Property()
  public lugar: string = "";

  @Property()
  public fechaSiembra: string = "";

  @Property()
  public insumosUsados: string = "";

  @Property()
  public tratamientosAplicados: string = "";
}

@Object()
export class LoteSemillas {
  @Property()
  public propietarioAddress: string = "";

  @Property()
  public lote: string = "";

  @Property()
  public variedad: string = "";

  @Property()
  public toneladas: number = 0;

  @Property()
  public fechaCompra: string = new Date().toISOString();

  @Property()
  public estado: "almacenado" | "sembrado" | "cosechado" = "almacenado";

  @Property()
  public condicionesAlmacenamiento?: CondicionesAlmacenamiento;

  @Property()
  public condicionesSiembra?: CondicionesSiembra;
}
