/*
  Formato Usuario Key: rol/nombre/metamaskAddress
*/

import { Object, Property } from "fabric-contract-api";
@Object()
export class UsuarioAndKeys {
  @Property()
  public usuario:Usuario = new Usuario();
  @Property()
  public key:string = "";
}

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
