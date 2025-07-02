// File: chaincode/contracts/AdminContrato.ts
/*
  Formato Usuario Key: rol:nombre:metamaskAddress
*/

// Importamos las dependencias necesarias de Hyperledger Fabric
import {
  Contract,
  Context,
  Info,
  Returns,
  Transaction,
} from "fabric-contract-api";
import { Usuario } from "../assets/Usuario";

@Info({
  title: "AdminContrato",
  description:
    "Contrato para la gestión de usuarios en la red Hyperledger Fabric",
})
export class ContratoAdmin extends Contract {
  // Función para verificar si el usuario es un administrador
  // Esta función se asegura de que solo los usuarios con rol "admin" puedan ejecutar las transacciones
  private verificarAdmin(ctx: Context): void {
    const role = ctx.clientIdentity.getAttributeValue("role");
    if (role !== "admin") {
      throw new Error(
        'Solo los usuarios con rol "admin" pueden ejecutar esta transacción.'
      );
    }
  }
  // Función para verificar si un usuario ya existe
  private async usuarioExiste(ctx: Context, key: string): Promise<boolean> {
    // Obtenemos el estado del usuario usando la clave compuesta
    const buffer = await ctx.stub.getState(key);
    // Si el buffer obtenido está vacío o no existe, el usuario no existe
    return !!(buffer && buffer.length > 0);
  }

  // ⚙️ Función para inicializar el ledger
  @Transaction()
  @Returns("void")
  async initLedger(ctx: Context): Promise<void> {
    // Creamos una array de usuarios iniciales
    const initialUsers: Usuario[] = [
      {
        nombre: "David",
        rol: "admin",
        metamaskAddress: "0x070aabF219f35bF191C0d866F412d39d92ba2f79",
        fabricIdentityId: "adminIdentity",
      },
    ];
    // Iteramos sobre los usuarios iniciales y los guardamos en el world state
    for (const user of initialUsers) {
      // Usamos createCompositeKey para crear una clave compuesta para cada usuario
      const key = await ctx.stub.createCompositeKey("usuario", [
        user.metamaskAddress,
        user.rol,
        user.nombre,
      ]);
      // Verificamos si el usuario ya existe
      const existe = await this.usuarioExiste(ctx, key);
      if (existe) {
        throw new Error(`El usuario con ID ${key} ya existe.`);
      }
      // Guardamos el usuario en el world state
      await ctx.stub.putState(key, Buffer.from(JSON.stringify(user)));
    }
  }

  // 👤 Función para registrar un nuevo usuario
  @Transaction()
  @Returns("string")
  async registrarUsuario(
    ctx: Context,
    nombre: string,
    metamaskAddress: string,
    rol: string,
    fabricIdentityId: string
  ): Promise<void> {
    // Virificamos que el usuario que llama a esta función sea un admin
    this.verificarAdmin(ctx);

    // Construimos una clave para el usuario
    const key = ctx.stub.createCompositeKey("usuario", [
      rol,
      nombre,
      metamaskAddress,
    ]);

    // Verificamos si el usuario ya existe
    const existe = await this.usuarioExiste(ctx, key);
    if (existe) {
      throw new Error(`El usuario con ID ${key} ya existe.`);
    }

    // Creamos un asset Usuario
    const usuario: Usuario = { rol, nombre, metamaskAddress, fabricIdentityId };
    // Guardamos el usuario en el world state
    await ctx.stub.putState(key, Buffer.from(JSON.stringify(usuario)));
  }

  // 🗑️ Función para eliminar un usuario
  @Transaction()
  @Returns("void")
  async eliminarUsuario(
    ctx: Context,
    rol: string,
    nombre: string,
    metamaskAddress: string
  ): Promise<void> {
    // Construimos la clave del usuario
    const key = ctx.stub.createCompositeKey("usuario", [
      rol,
      nombre,
      metamaskAddress,
    ]);
    // Verificamos que el usuario que llama a esta función sea un admin
    this.verificarAdmin(ctx);
    // Verificamos si el usuario existe
    const existe = await this.usuarioExiste(ctx, key);
    if (!existe) {
      throw new Error(`No existe un usuario con ID ${key}.`);
    }
    // Eliminamos el usuario del world state
    await ctx.stub.deleteState(key);
  }

  // 👀 Función para leer un usuario
  @Transaction()
  @Returns("string")
  async leerUsuario(
    ctx: Context,
    rol: string,
    nombre: string,
    metamaskAddress: string
  ): Promise<string> {
    // Verificamos que el usuario que llama a esta función sea un admin
    this.verificarAdmin(ctx);
    // Construimos la clave del usuario
    const key = ctx.stub.createCompositeKey("usuario", [
      rol,
      nombre,
      metamaskAddress,
    ]);
    // Obtenemos el usuario del world state
    // Si existe lo retornamos, si no, lanzamos un error
    const userBuffer = await ctx.stub.getState(`usuario:${key}`);
    if (!userBuffer || userBuffer.length === 0) {
      throw new Error(`Usuario con ID ${key} no encontrado.`);
    }
    return userBuffer.toString();
  }

  // 📋 Función para listar todos los usuarios por rol
  @Transaction()
  @Returns("string[]")
  async listarUsuariosPorRol(ctx: Context, rol: string): Promise<string[]> {
    // Verificamos que el usuario que llama a esta función sea un admin
    this.verificarAdmin(ctx);

    // Iteramos sobre los usuarios con el rol especificado
    // Usamos getStateByPartialCompositeKey para obtener todos los usuarios con el rol especificado
    // getStateByPartialCompositeKey retorna un iterador que podemos recorrer para obtener los usuarios
    const resultadosIterator = await ctx.stub.getStateByPartialCompositeKey(
      "usuario",
      [rol]
    );

    // Creamos un array para almacenar los usuarios en formato JSON
    const usersJSON: string[] = [];

    // Recorremos el iterador para obtener los usuarios
    while (true) {
      // Obtenemos el siguiente resultado del iterador
      const res = await resultadosIterator.next();
      // Si el resultado tiene un valor, lo parseamos a JSON y lo agregamos al array
      if (res.value && res.value.value) {
        const usuario = JSON.parse(res.value.value.toString()) as Usuario;
        usersJSON.push(JSON.stringify(usuario));
      }
      // Si el iterador ha terminado, cerramos el iterador y salimos del bucle
      if (res.done) {
        await resultadosIterator.close();
        break;
      }
    }

    // Si no se encontraron usuarios con el rol especificado, lanzamos un error
    if (usersJSON.length === 0) {
      throw new Error(`No se encontraron usuarios con el rol ${rol}.`);
    }
    // Retornamos el array de usuarios en formato JSON
    return usersJSON;
  }
}
