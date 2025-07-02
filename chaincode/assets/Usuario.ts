import { Object, Property } from "fabric-contract-api";

@Object()
export class Usuario {
  @Property()
  public nombre:string = "";
  @Property()
  public rol:string = "";
  @Property()
  public metamaskAddress:string = "";
  @Property()
  public fabricIdentityId:string = "";
}
