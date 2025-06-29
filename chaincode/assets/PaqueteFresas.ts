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
  public idPaquete = "";
  @Property()
  public idGranel = "";
  @Property()
  public fechaEmpaque = "";
  @Property()
  public propietario = "";
  @Property()
  public tipoEmpaque = "";
  @Property()
  public centroEmpaque = "";
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
