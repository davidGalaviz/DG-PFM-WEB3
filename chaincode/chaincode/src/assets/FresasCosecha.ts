import { Object, Property } from "fabric-contract-api";

@Object()
export class FresasCosecha {
  @Property()
  public idLoteSemillas:string = "";
  @Property()
  public cosechaID:string = "";
  @Property()
  public propietario:string = "";
  @Property()
  public fechaCosecha:string = "";
  @Property()
  public variedad:string = "";
  @Property()
  public kilosTotales:number = 0;
  @Property()
  public kilosAunNoCosechados:number = 0;
  @Property()
  public responsableCosecha:string = "";
  @Property()
  public condicionesRecoleccion:string = "";
  @Property()
  public tempDuranteCosecha:number = 0;
}
