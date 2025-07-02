import { Object, Property } from "fabric-contract-api";

export interface DatosRecoleccionPaqueteFresas {
  empresaTransportista: string;
  fechaRecoleccion: string;
  vehiculo: string;
}

export interface DatosEntregaPaqueteFresas {
  ruta: string;
  fechaLlegada: string;
}

@Object()
export class PaqueteFresas {
  @Property()
  public idPaquete:string = "";
  @Property()
  public idGranel:string = "";
  @Property()
  public fechaEmpaque:string = "";
  @Property()
  public propietario:string = "";
  @Property()
  public tipoEmpaque:string = "";
  @Property()
  public centroEmpaque:string = "";
  /**
   * Datos acerca del transporte hacia el distribuidor.
   */
  @Property()
  public transporteDistribuidor?: {
    datosRecoleccion?: DatosRecoleccionPaqueteFresas;
    datosEntrega?: DatosEntregaPaqueteFresas;
  };
  @Property()
  public transportePuntoVenta?: {
    datosRecoleccion?: DatosRecoleccionPaqueteFresas;
    datosEntrega?: DatosEntregaPaqueteFresas;
  };
}
