import { Object, Property } from "fabric-contract-api";

@Object()
export class DatosRecoleccionPaqueteFresas {
  @Property()
  empresaTransportista: string = "";
  @Property()
  fechaRecoleccion: string = "";
  @Property()
  vehiculo: string = "";
}

@Object()
export class DatosEntregaPaqueteFresas {
  @Property()
  ruta: string = "";
  @Property()
  fechaLlegada: string = "";
}

@Object()
export class TransporteFresas {
  @Property()
  public datosRecoleccion?: DatosRecoleccionPaqueteFresas;

  @Property()
  public datosEntrega?: DatosEntregaPaqueteFresas;
}

@Object()
export class PaqueteFresas {
  @Property()
  public idPaquete:string = "";
  @Property()
  public idCosecha:string = "";
  @Property()
  public fechaEmpaque:string = "";
  @Property()
  public propietarioAddress:string = "";
  @Property()
  public tipoEmpaque:string = "";
  @Property()
  public centroEmpaque:string = "";
  /**
   * Datos acerca del transporte hacia el distribuidor.
   */
  @Property()
  public transporteDistribuidor: TransporteFresas = new TransporteFresas();
  @Property()
  public transportePuntoVenta: TransporteFresas = new TransporteFresas();
}
