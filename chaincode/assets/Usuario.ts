import { Object, Property } from "fabric-contract-api";

@Object()
export class Usuario {
  @Property()
  public nombre = "";
  @Property()
  public rol = "";
  @Property()
  public metamaskAddress = "";
}
