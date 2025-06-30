import {
  Contract,
  Context,
  Info,
  Returns,
  Transaction,
} from "fabric-contract-api";

@Info({
  title: "AdminContrato",
  description:
    "Contrato para gestionar usarios, solo un admin lo puede ejecutar",
})
export default class AdminContrato extends Contract {
  @Transaction()
  @Returns("string")
  public async RegistrarUsuario(
    ctx: Context,
    nombre: string,
    rol: string,
    metamaskAddress: string
  ): Promise<string> {
    // Crear una nueva identidad de Fabric

    // Crear un asset "Usuario"
    return "";
  }

  @Transaction()
  @Returns("string")
  public async EliminarUsuario(ctx: Context): Promise<string> {
    return "";
  }

  @Transaction(false)
  @Returns("string")
  public async ConsultarUsuarios(ctx: Context): Promise<string> {
    return "";
  }
}
