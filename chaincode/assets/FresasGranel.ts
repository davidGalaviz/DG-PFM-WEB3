import { Object, Property } from "fabric-contract-api";

@Object()
export class FresasGranel {
  @Property()
  public idLoteSemillas = "";
  @Property()
  public fechaCosecha = "";
  @Property()
  public variedad = "";
  @Property()
  public toneladas = 0;
  @Property()
  public responsableCosecha = "";
  @Property()
  public condicionesRecoleccion = "";
  @Property()
  public tempDuranteCosecha = 0;
}
