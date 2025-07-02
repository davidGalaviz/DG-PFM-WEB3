import { Object, Property } from "fabric-contract-api";

@Object()
export class FresasGranel {
  @Property()
  public idLoteSemillas:string = "";
  @Property()
  public fechaCosecha:string = "";
  @Property()
  public variedad:string = "";
  @Property()
  public toneladas:number = 0;
  @Property()
  public responsableCosecha:string = "";
  @Property()
  public condicionesRecoleccion:string = "";
  @Property()
  public tempDuranteCosecha:number = 0;
}
