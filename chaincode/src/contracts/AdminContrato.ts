// File: chaincode/contracts/AdminContrato.ts
/*
  Formato Usuario Key principal: rol/metamaskAddress
  Formato Usuario Key derivada: metamaskAddress/rol
*/

// Importamos las dependencias necesarias de Hyperledger Fabric
import {
  Contract,
  Context,
  Info,
  Returns,
  Transaction,
} from "fabric-contract-api";
import { Usuario, UsuarioAndKeys } from "../assets/Usuario";

@Info({
  title: "AdminContrato",
  description: "Contrato para la gestión de usuarios usando claves derivadas",
})
export class AdminContrato extends Contract {
  // 🔨 Funciones auxiliares
  // Función para construir la clave principal
  private construirClavePrincipal(
    ctx: Context,
    rol: string,
    address: string
  ): string {
    return ctx.stub.createCompositeKey("usuario", [rol, address]);
  }

  // Función para construir la clave derivada
  private construirClaveDerivada(
    ctx: Context,
    address: string,
    rol: string
  ): string {
    return ctx.stub.createCompositeKey("metamaskUsuario", [address, rol]);
  }
  // Función para validar que un campo no este vacio
  private validarNoVacio(campo: string, valor: string): void {
    if (!valor || valor.trim() === "") {
      throw new Error(`El campo ${campo} no puede estar vacío.`);
    }
  }
  // Función para verificar si el usuario es un admin
  private verificarAdmin(ctx: Context): void {
    const role = ctx.clientIdentity.getAttributeValue("role");
    if (role !== "admin") {
      throw new Error(
        'Solo los usuarios con rol "admin" pueden ejecutar esta transacción.'
      );
    }
  }
  // Función para verificar si el usuario ya existe
  private async usuarioExiste(ctx: Context, key: string): Promise<boolean> {
    const buffer = await ctx.stub.getState(key);
    return !!(buffer && buffer.length > 0);
  }

  // ⭐ Funciones del contrato (Transacciones y Queries)
  // Función para crear el admin inicial
  @Transaction()
  @Returns("void")
  async createInitialAdmin(ctx: Context): Promise<void> {
    // Verificar que el usuario que llama a la transacción es el bootstrap admin


    // Crear asset de admin inicial
    const initialUser: Usuario = {
      nombre: "David",
      rol: "admin",
      metamaskAddress: "0x070aabF219f35bF191C0d866F412d39d92ba2f79",
      fabricIdentityId: "adminApp",
    };
    // Crear la clave principal del admin
    const keyPrincipal = this.construirClavePrincipal(
      ctx,
      initialUser.rol,
      initialUser.metamaskAddress
    );
    // Verificar si el admin ya existe
    const existe = await this.usuarioExiste(ctx, keyPrincipal);
    if (!existe) {
      // Si el admin no existe, guardarlo en el WorldState con la clave principal
      await ctx.stub.putState(
        keyPrincipal,
        Buffer.from(JSON.stringify(initialUser))
      );
      // Crear la clave derivada del admin
      const keyDerivada = this.construirClaveDerivada(
        ctx,
        initialUser.metamaskAddress,
        initialUser.rol
      );
      // Guardar la clave derivada en el WorldState
      await ctx.stub.putState(keyDerivada, Buffer.from("\u0000"));
    }
  }

  // 👤 Transacción para registrar un nuevo usuario
  @Transaction()
  @Returns("Usuario")
  async registrarUsuario(
    ctx: Context,
    nombre: string,
    metamaskAddress: string,
    rol: string,
    fabricIdentityId: string
  ): Promise<Usuario> {
    // Verificar que el usuario que llama a la transacción es el admin
    this.verificarAdmin(ctx);

    // verificar que los parámetros sean validos
    this.validarNoVacio("nombre", nombre);
    this.validarNoVacio("rol", rol);
    this.validarNoVacio("metamaskAddress", metamaskAddress);

    // Construir la clave principal del usuario
    const keyPrincipal = this.construirClavePrincipal(
      ctx,
      rol,
      metamaskAddress
    );
    // Verificar si el usuario ya existe
    if (await this.usuarioExiste(ctx, keyPrincipal)) {
      throw new Error(`El usuario ya existe con address: ${metamaskAddress}`);
    }
    // Guardar el usuario en el WorldState con la clave principal
    const usuario: Usuario = { rol, nombre, metamaskAddress, fabricIdentityId };
    await ctx.stub.putState(keyPrincipal, Buffer.from(JSON.stringify(usuario)));
    // Crear la clave derivada del usuario
    const keyDerivada = this.construirClaveDerivada(ctx, metamaskAddress, rol);
    // Guardar la clave derivada en el WorldState
    await ctx.stub.putState(keyDerivada, Buffer.from("\u0000"));

    // Emitir el evento de usuario registrado
    ctx.stub.setEvent(
      "UsuarioRegistrado",
      Buffer.from(JSON.stringify(usuario))
    );
    return usuario as Usuario;
  }

  // 🗑️ Transacción para eliminar un usuario
  @Transaction()
  @Returns("void")
  async eliminarUsuario(ctx: Context, metamaskAddress: string): Promise<void> {
    // Verificar que el usuario que llama a la transacción es admin
    this.verificarAdmin(ctx);

    // Verificar si el usuario existe
    if (!(await this.usuarioExiste(ctx, metamaskAddress))) {
      throw new Error(`El usuario con address: "${metamaskAddress}" no existe.`);
    }
    // Leer el usuario
    const usuarioObj = await this.leerUsuario(ctx, metamaskAddress);
    // Obtener el rol del usuario para construir las claves
    const rol = usuarioObj.usuario.rol;

    // Construir la clave principal del usuario
    const keyPrincipal = this.construirClavePrincipal(
      ctx,
      rol,
      metamaskAddress
    );
    // Construir la clave derivada del usuario
    const keyDerivada = this.construirClaveDerivada(ctx, metamaskAddress, rol);

    // Eliminar el usuario del WorldState
    // Eliminar la clave principal del usuario
    await ctx.stub.deleteState(keyPrincipal);
    // Eliminar la clave derivada del usuario
    await ctx.stub.deleteState(keyDerivada);
  }

  // 🔍 Transacción para leer un usuario
  @Transaction()
  @Returns("UsuarioAndKeys")
  public async leerUsuario(
    ctx: Context,
    metamaskAddress: string
  ): Promise<UsuarioAndKeys> {
    // Verificar que el usuario que llama a la transacción es admin o es el propio usuario
    const address = ctx.clientIdentity.getAttributeValue("metamaskAddress");
    if (address !== metamaskAddress) {
      this.verificarAdmin(ctx);
    }

    // Obtener el usuario del WorldState
    const iterator = await ctx.stub.getStateByPartialCompositeKey("metamaskUsuario", [
      metamaskAddress,
    ]);
    while (true) {
      const res = await iterator.next();
      if (res.value && res.value.key) {
        // Obtener el rol del usuario para construir las claves
        const composite = ctx.stub.splitCompositeKey(res.value.key);
        const rol = composite.attributes[1];
        // Construir la clave principal del usuario
        const keyUsuario = this.construirClavePrincipal(
          ctx,
          rol,
          metamaskAddress
        );
        // Obtener el usuario con la clave principal
        const usuarioBytes = await ctx.stub.getState(keyUsuario);
        // Si el usuario existe, retornarlo
        if (usuarioBytes && usuarioBytes.length > 0) {
          await iterator.close();
          return {
            usuario: JSON.parse(usuarioBytes.toString()),
            key: keyUsuario,
          };
        }
      }
      if (res.done) {
        await iterator.close();
        break;
      }
    }
    // Si el usuario no existe, lanzar un error
    throw new Error(`Usuario con address: "${metamaskAddress}" no encontrado.`);
  }

  // 📋 Transacción para listar los usuarios por rol
  @Transaction()
  @Returns("Usuario[]")
  async listarUsuariosPorRol(ctx: Context, rol: string): Promise<Usuario[]> {
    // Verificar que el usuario que llama a la transacción es admin
    this.verificarAdmin(ctx);

    // Obtener un iterador de los usuarios con el rol correspondiente
    const iterator = await ctx.stub.getStateByPartialCompositeKey("usuario", [
      rol,
    ]);
    // Crear un array para almacenar los usuarios
    const usuarios: Usuario[] = [];

    // Recorrer el iterador y agregar los usuarios al array
    while (true) {
      const res = await iterator.next();
      if (res.value && res.value.value) {
        // Parsear el valor del usuario a un objeto
        const usuario = JSON.parse(res.value.value.toString()) as Usuario;
        // Agregar el usuario al array
        usuarios.push(usuario);
      }
      // Si se llega al final del iterador, cerrarlo
      if (res.done) {
        await iterator.close();
        break;
      }
    }
    // Si no se encontraron usuarios con el rol, lanzar un error
    if (usuarios.length === 0) {
      throw new Error(`No se encontraron usuarios con el rol ${rol}.`);
    }

    // Retornar el array de usuarios si se encontraron
    return usuarios;
  }
}
