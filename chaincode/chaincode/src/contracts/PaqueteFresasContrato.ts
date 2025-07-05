// File: chaincode/contracts/PaqueteFresasContrato.ts
/*
  Formato PaqueteFresas Key 1: “paqueteFresasID”/paqueteID/cosechaFresasKey
  Formato PaqueteFresas Key 2: “paqueteFresas”/cosechaFresasKey/paqueteID
  Formato PropietarioPaqueteFresasVariedad Key: “propietarioPaqueteFresasVariedad”/metamaskAddress/variedad
*/

// Importamos las dependencias necesarias de Hyperledger Fabric
import {
  Context,
  Contract,
  Info,
  Returns,
  Transaction,
} from "fabric-contract-api";
import {
  PaqueteFresas,
  DatosRecoleccionPaqueteFresas,
  DatosEntregaPaqueteFresas,
} from "../assets/PaqueteFresas";
import { PropietarioPaqueteFresasVariedad } from "../assets/PropietarioPaqueteFresasVariedad";
import { Usuario } from "../assets/Usuario";

@Info({
  title: "PaqueteFresasContrato",
  description: "Contrato para gestionar los paquetes de fresas",
})
export class PaqueteFresasContrato extends Contract {
  // 🔨 Fnciones Auxiliares
  // Función para crear la key del paquete para búsqueda por ID
  private crearKeyID(paqueteID: string, cosechaKey: string) {
    return `paqueteFresasID/${paqueteID}/${cosechaKey}`;
  }
  // Función para crear la key del paquete para búsqueda por cosecha
  private crearKeyCosecha(cosechaKey: string, paqueteID: string) {
    return `paqueteFresas/${cosechaKey}/${paqueteID}`;
  }
  // Función para crear la key del indice
  private crearKeyIndiceVariedad(propietario: string, variedad: string) {
    return `PropietarioPaqueteFresasVariedad/${propietario}/${variedad}`;
  }
  // Función para verificar el rol del usuario
  private async verificarRol(ctx: Context, rolEsperado: string) {
    const rol = ctx.clientIdentity.getAttributeValue("rol");
    if (rol !== rolEsperado) {
      throw new Error(`Esta transacción requiere el rol ${rolEsperado}`);
    }
    return rol;
  }

  // ⭐ Funciones del contrato (Transacciones)

  // 📦 Transacción para empacar fresas
  // Esta transacción empaca todas las fresas de una cosecha
  // Se requiere el rol de empaquetador
  @Transaction()
  public async empacarFresas(
    ctx: Context,
    cosechaKey: string,
    variedad: string,
    tipoEmpaque: string,
    centroEmpaque: string,
    fechaEmpaque: string,
    paquetesIDs: string[]
  ) {
    // Verificar que el usuario que llama a la transacción es el empaquetador
    await this.verificarRol(ctx, "empaquetador");
    // Posible error ⚠️⚠️⚠️⚠️⚠️⚠️⚠️
    const propietario = cosechaKey.split("/")[0];

    // Recorrer los IDs de los paquetes
    for (const paqueteID of paquetesIDs) {
      // Crear un objeto PaqueteFresas con los datos proporcionados
      const paquete = new PaqueteFresas();
      paquete.idPaquete = paqueteID;
      paquete.idCosecha = cosechaKey;
      paquete.fechaEmpaque = fechaEmpaque;
      paquete.propietarioAddress = propietario;
      paquete.tipoEmpaque = tipoEmpaque;
      paquete.centroEmpaque = centroEmpaque;

      // Crear los keys del paquete
      const keyID = this.crearKeyID(paqueteID, cosechaKey);
      const keyInversa = this.crearKeyCosecha(cosechaKey, paqueteID);

      // Guardar el paquete en el ledger
      await ctx.stub.putState(keyID, Buffer.from(JSON.stringify(paquete)));
      await ctx.stub.putState(keyInversa, Buffer.from(JSON.stringify(paquete)));

      // Construir el key del indice
      const keyIndice = this.crearKeyIndiceVariedad(propietario, variedad);
      // Obtener el asset del indice
      const indexBytes = await ctx.stub.getState(keyIndice);
      // Si el indice no existe, crearlo
      let index: PropietarioPaqueteFresasVariedad =
        indexBytes.length > 0
          ? JSON.parse(indexBytes.toString())
          : { propietarioAddress: propietario, variedad, paquetesFresas: [] };

      // Agregar el paquete al indice
      index.paquetesFresas.push(paquete);

      // Guardar el indice
      await ctx.stub.putState(keyIndice, Buffer.from(JSON.stringify(index)));
    }
  }

  // Transacción para comprar paquetes de fresas en mayoreo
  // Esta transacción compra todos los paquetes de fresas corespondientes a una cosecha
  // Se requiere el rol de distribuidor para realizar la transacción
  @Transaction()
  public async comprarMayoreo(
    ctx: Context,
    cosechaKey: string,
    variedad: string
  ) {
    // Verificar que el usuario que llama a la transacción es un distribuidor
    await this.verificarRol(ctx, "distribuidor");
    // Asignar el nuevo propietario al distribuidor que llama la transacción
    const nuevoPropietario = ctx.clientIdentity.getID();

    // Obtener un iterador para recorrer los paquetes de fresas correspondientes a la cosecha
    const iterator = await ctx.stub.getStateByPartialCompositeKey(
      "paqueteFresas",
      [cosechaKey]
    );
    // Crear un array para almacenar los paquetes actualizados
    const nuevosPaquetes: PaqueteFresas[] = [];

    const paquetesPorPropietarioAnterior: Map<string, PaqueteFresas[]> =
      new Map();

    // Recorrer el iterador y actualizar el propietario de los paquetes
    while (true) {
      // Obtener el siguiente elemento del iterador
      const res = await iterator.next();
      // Si todavía hay elementos en el iterador...
      if (res.value && res.value.value) {
        // Parsear el paquete a un objeto
        const paquete: PaqueteFresas = JSON.parse(res.value.value.toString());
        // Obtener el propietario anterior del paquete
        const propietarioAnterior = paquete.propietarioAddress;

        // ❓❓❓
        if (!paquetesPorPropietarioAnterior.has(propietarioAnterior)) {
          paquetesPorPropietarioAnterior.set(propietarioAnterior, []);
        }
        paquetesPorPropietarioAnterior.get(propietarioAnterior)!.push(paquete);

        paquete.propietarioAddress = nuevoPropietario;
        // ❓❓❓

        // Crear los keys del paquete
        const keyID = this.crearKeyID(paquete.idPaquete, paquete.idCosecha);
        const keyInversa = this.crearKeyCosecha(
          paquete.idCosecha,
          paquete.idPaquete
        );
        // Actualizar el paquete en el ledger
        await ctx.stub.putState(keyID, Buffer.from(JSON.stringify(paquete)));
        await ctx.stub.putState(
          keyInversa,
          Buffer.from(JSON.stringify(paquete))
        );

        // Agregar el paquete al array de paquetes actualizados
        nuevosPaquetes.push(paquete);
      }
      if (res.done) break;
    }

    // 🧹 Limpiar índices de propietarios anteriores
    // Iterar sobre los paquetes por propietario anterior
    for (const [
      anterior,
      paquetes,
    ] of paquetesPorPropietarioAnterior.entries()) {
      // Construir el key del indice
      const keyIndiceAnterior = this.crearKeyIndiceVariedad(anterior, variedad);
      // Obtener el asset del indice
      const indexAnteriorBytes = await ctx.stub.getState(keyIndiceAnterior);
      // Si el indice existe...
      if (indexAnteriorBytes && indexAnteriorBytes.length > 0) {
        // Parsear el indice anterior a un objeto
        const indexAnterior: PropietarioPaqueteFresasVariedad = JSON.parse(
          indexAnteriorBytes.toString()
        );

        // Filtrar los paquetes vendidos
        // Crear un nuevo array con los paquetes restantes
        const nuevosPaquetesRestantes = indexAnterior.paquetesFresas.filter(
          (pf) =>
            !paquetes.some(
              (p) =>
                p.idPaquete === pf.idPaquete && p.idCosecha === pf.idCosecha
            )
        );

        // Si quedan paquetes restantes(no vendidos)...
        if (nuevosPaquetesRestantes.length > 0) {
          // Actualizar el indice
          indexAnterior.paquetesFresas = nuevosPaquetesRestantes;
          await ctx.stub.putState(
            keyIndiceAnterior,
            Buffer.from(JSON.stringify(indexAnterior))
          );
        } else {
          // Si no quedan paquetes restantes, eliminar el indice
          await ctx.stub.deleteState(keyIndiceAnterior);
        }
      }
    }

    // 📥 Agregar paquetes al nuevo índice (distribuidor)

    // Se genera la clave de índice derivado que apunta a todos los paquetes que un propietario tiene de una variedad específica.
    const keyIndiceNuevo = this.crearKeyIndiceVariedad(
      nuevoPropietario,
      variedad
    );

    // Se obtiene del ledger el estado actual del índice (si existe) para ese propietario y variedad.
    const indexNuevoBytes = await ctx.stub.getState(keyIndiceNuevo);

    // Si ya existe un índice para ese propietario y variedad...
    if (indexNuevoBytes && indexNuevoBytes.length > 0) {
      // Se parsea el índice existente desde bytes a objeto JavaScript.
      const indexExistente: PropietarioPaqueteFresasVariedad = JSON.parse(
        indexNuevoBytes.toString()
      );

      // Se agregan los nuevos paquetes (comprados al mayoreo) al arreglo existente de paquetes.
      indexExistente.paquetesFresas.push(...nuevosPaquetes);

      // Se sobrescribe el índice actualizado en el ledger.
      await ctx.stub.putState(
        keyIndiceNuevo,
        Buffer.from(JSON.stringify(indexExistente))
      );
    } else {
      // Si no existía un índice aún, se crea uno nuevo con los paquetes recién adquiridos.
      const indexNuevo: PropietarioPaqueteFresasVariedad = {
        propietarioAddress: nuevoPropietario,
        variedad,
        paquetesFresas: nuevosPaquetes,
      };

      // Se guarda el nuevo índice en el ledger.
      await ctx.stub.putState(
        keyIndiceNuevo,
        Buffer.from(JSON.stringify(indexNuevo))
      );
    }
  }

  // El transportista recolecta del almacen los paquetes de un distribuidor
  @Transaction()
  public async recolectarDistribuidor(
    ctx: Context,
    cosechaKey: string,
    datos: DatosRecoleccionPaqueteFresas
  ) {
    // Verifica que quien ejecuta esto es un transportista
    await this.verificarRol(ctx, "transportista");

    // Obtiene todos los paquetes de la cosecha específica
    const iterator = await ctx.stub.getStateByPartialCompositeKey(
      "paqueteFresas",
      [cosechaKey]
    );

    // Recorre todos los paquetes
    while (true) {
      const res = await iterator.next();
      if (res.value && res.value.value) {
        // Parsea el paquete a un objeto
        const paquete: PaqueteFresas = JSON.parse(res.value.value.toString());

        // Verifica que el paquete aún no ha sido recolectado
        const yaRecolectado =
          paquete.transporteDistribuidor.datosRecoleccion !== undefined;
        if (yaRecolectado) continue;

        // Verifica que el propietario actual es un distribuidor (tiene que haberlo comprado al mayoreo)
        const propietarioAddress = paquete.propietarioAddress;
        // leer el usuario
        const propietarioUser = (
          await this.leerUsuario(ctx, propietarioAddress)
        ).asset;
        // Si el propietario no es un distribuidor saltamos al siguiente paquete
        if (propietarioUser.rol !== "distribuidor") continue;

        // Asigna los datos de recolección en el transporte hacia el distribuidor
        paquete.transporteDistribuidor = {
          ...(paquete.transporteDistribuidor || {}),
          datosRecoleccion: datos,
        };

        // Construir ambas claves para el paquete
        const keyID = this.crearKeyID(paquete.idPaquete, paquete.idCosecha);
        const keyInversa = this.crearKeyCosecha(
          paquete.idCosecha,
          paquete.idPaquete
        );
        // Guarda el paquete actalizado en el ledger
        await ctx.stub.putState(keyID, Buffer.from(JSON.stringify(paquete)));
        await ctx.stub.putState(
          keyInversa,
          Buffer.from(JSON.stringify(paquete))
        );
      }

      if (res.done) break;
    }
  }

  @Transaction()
  public async entregarDistribuidor(
    ctx: Context,
    cosechaKey: string,
    datos: DatosEntregaPaqueteFresas
  ) {
    // Verifica que quien ejecuta esto es un transportista
    await this.verificarRol(ctx, "transportista");

    // Obtiene todos los paquetes asociados a la cosecha
    const iterator = await ctx.stub.getStateByPartialCompositeKey(
      "paqueteFresas",
      [cosechaKey]
    );

    // Recorre todos los paquetes de la cosecha
    while (true) {
      const res = await iterator.next();
      if (res.value && res.value.value) {
        const paquete: PaqueteFresas = JSON.parse(res.value.value.toString());

        const transporte = paquete.transporteDistribuidor;

        // Verifica que el paquete ya fue recolectado pero aún no entregado
        if (transporte.datosRecoleccion && !transporte.datosEntrega) {
          // Asigna los datos de entrega a  la propiedad "transporte hacia el distribuidor"
          paquete.transporteDistribuidor.datosEntrega = datos;

          // Construir ambas claves para el paquete
          const keyID = this.crearKeyID(paquete.idPaquete, paquete.idCosecha);
          const keyInversa = this.crearKeyCosecha(
            paquete.idCosecha,
            paquete.idPaquete
          );
          // Guarda el paquete actalizado en el ledger
          await ctx.stub.putState(keyID, Buffer.from(JSON.stringify(paquete)));
          await ctx.stub.putState(
            keyInversa,
            Buffer.from(JSON.stringify(paquete))
          );
        }
      }

      if (res.done) break;
    }
  }

  // Transacción para comprar un paquete
  // Esta transacción solo puede ser ejecutada por un minorista
  @Transaction()
  public async comprarMenudeo(ctx: Context, paqueteID: string) {
    // Verifica que quien ejecuta esto es un minorista
    await this.verificarRol(ctx, "minorista");
    // Obtener el address del nuevo propietario
    const nuevoPropietario = ctx.clientIdentity.getAttributeValue("address");
    if (!nuevoPropietario) {
      throw new Error("No se pudo obtener el address del usuario");
    }

    // Buscar el paquete por paqueteFresasID/paqueteID/*
    const iterator = await ctx.stub.getStateByPartialCompositeKey(
      "paqueteFresasID",
      [paqueteID]
    );
    // Verificar que el paquete exista
    const res = await iterator.next();
    if (!res.value || !res.value.value) {
      throw new Error("Paquete no encontrado");
    }

    // Si el paquete existe, parsearlo en un objeto
    const paquete: PaqueteFresas = JSON.parse(res.value.value.toString());

    // Guardar el propietario anterior para actualizar su índice
    const propietarioAnterior = paquete.propietarioAddress;

    // Extraer la variedad desde la estructura de idCosecha
    const partesCosecha = paquete.idCosecha.split("/");
    if (partesCosecha.length < 3) {
      throw new Error(
        "idCosecha no contiene suficiente información para obtener la variedad"
      );
    }
    const variedad = partesCosecha[2]; // Formato de idCosecha: "cosechaFresas/propietario/variedad/..."

    // Cambiar el propietario del paquete
    paquete.propietarioAddress = nuevoPropietario;

    // Construir ambas claves para el paquete
    const keyID = this.crearKeyID(paquete.idPaquete, paquete.idCosecha);
    const keyInversa = this.crearKeyCosecha(
      paquete.idCosecha,
      paquete.idPaquete
    );

    // Guarda el paquete actalizado en el ledger
    await ctx.stub.putState(keyID, Buffer.from(JSON.stringify(paquete)));
    await ctx.stub.putState(keyInversa, Buffer.from(JSON.stringify(paquete)));

    // 📥 Agregar a índice del nuevo propietario
    // Obtener el índice del nuevo propietario
    const keyIndiceNuevo = this.crearKeyIndiceVariedad(
      nuevoPropietario,
      variedad
    );
    // Obtener el índice del nuevo propietario
    const indexBytes = await ctx.stub.getState(keyIndiceNuevo);
    // Si el indice ya existe...
    if (indexBytes && indexBytes.length > 0) {
      // Parsear el indice a un objeto
      const index: PropietarioPaqueteFresasVariedad = JSON.parse(
        indexBytes.toString()
      );
      // Verificar si el paquete ya estaba en el indice
      const yaExiste = index.paquetesFresas.some(
        (p) =>
          p.idPaquete === paquete.idPaquete && p.idCosecha === paquete.idCosecha
      );
      // Si el paquete no estaba en el indice, agregarlo
      if (!yaExiste) {
        // Agregar el paquete al array del indice
        index.paquetesFresas.push(paquete);
        // Actualizar el indice
        await ctx.stub.putState(
          keyIndiceNuevo,
          Buffer.from(JSON.stringify(index))
        );
      }
    } else {
      // Si el indice no existe, crearlo
      const nuevoIndice: PropietarioPaqueteFresasVariedad = {
        propietarioAddress: nuevoPropietario,
        variedad,
        paquetesFresas: [paquete],
      };
      // Guardar el nuevo indice en el ledger
      await ctx.stub.putState(
        keyIndiceNuevo,
        Buffer.from(JSON.stringify(nuevoIndice))
      );
    }

    // 🧹 Remover del índice del propietario anterior
    // construir la key para el indice anterior
    const keyIndiceAnterior = this.crearKeyIndiceVariedad(
      propietarioAnterior,
      variedad
    );
    // obtener el indice
    const anteriorBytes = await ctx.stub.getState(keyIndiceAnterior);
    // si el indice ya existe...
    if (anteriorBytes && anteriorBytes.length > 0) {
      // Parsear el indice a un objeto
      const indexAnterior: PropietarioPaqueteFresasVariedad = JSON.parse(
        anteriorBytes.toString()
      );
      // Eliminar el paquete del indice
      const restantes = indexAnterior.paquetesFresas.filter(
        (p) =>
          !(
            p.idPaquete === paquete.idPaquete &&
            p.idCosecha === paquete.idCosecha
          )
      );
      // Si quedan paquetes en el indice, actualizarlo
      if (restantes.length > 0) {
        // Actualizar el array del indice
        indexAnterior.paquetesFresas = restantes;
        // Guardar el indice actualizado en el ledger
        await ctx.stub.putState(
          keyIndiceAnterior,
          Buffer.from(JSON.stringify(indexAnterior))
        );
      } else {
        // Si no quedan paquetes en el indice, eliminarlo
        await ctx.stub.deleteState(keyIndiceAnterior);
      }
    }
  }

  // Transacción para que un transportista recolecte un paquete para transportarlo a un punto de venta
  @Transaction()
  public async recolectarPuntoVenta(
    ctx: Context,
    minorista: string,
    datos: DatosRecoleccionPaqueteFresas
  ) {
    // Solo transportistas pueden ejecutar esta transacción
    await this.verificarRol(ctx, "transportista");

    // Buscar todos los índices del minorista, sin importar la variedad
    const iterator = await ctx.stub.getStateByPartialCompositeKey(
      "PropietarioPaqueteFresasVariedad",
      [minorista]
    );

    // Recorrer los índices
    while (true) {
      const res = await iterator.next();
      if (res.value && res.value.value) {
        // Parsear el indice a un objeto
        const index: PropietarioPaqueteFresasVariedad = JSON.parse(
          res.value.value.toString()
        );
        // Recorrer todos los paquetes del indice (hay un indice por variedad)
        for (const paquete of index.paquetesFresas) {
          // Filtrar solo paquetes que aún no han sido recolectados para punto de venta
          if (!paquete.transportePuntoVenta?.datosRecoleccion) {
            // Registrar los datos de recolección
            paquete.transportePuntoVenta = {
              ...(paquete.transportePuntoVenta || {}),
              datosRecoleccion: datos,
            };

            // Contruir ambas claves para el paquete
            const keyID = this.crearKeyID(paquete.idPaquete, paquete.idCosecha);
            const keyInversa = this.crearKeyCosecha(
              paquete.idCosecha,
              paquete.idPaquete
            );
            // Guardar el paquete actualizado en el ledger
            await ctx.stub.putState(
              keyID,
              Buffer.from(JSON.stringify(paquete))
            );
            await ctx.stub.putState(
              keyInversa,
              Buffer.from(JSON.stringify(paquete))
            );
          }
        }
      }

      if (res.done) break;
    }
  }

  // Transacción para que un transportista entregue un paquete a un punto de venta
  @Transaction()
  public async entregarPuntoVenta(
    ctx: Context,
    minorista: string,
    datos: DatosEntregaPaqueteFresas
  ) {
    // Solo transportistas pueden ejecutar esta transacción
    await this.verificarRol(ctx, "transportista");

    // Obtener todos los índices de paquetes del minorista
    const iterator = await ctx.stub.getStateByPartialCompositeKey(
      "PropietarioPaqueteFresasVariedad",
      [minorista]
    );

    while (true) {
      const res = await iterator.next();
      if (res.value && res.value.value) {
        // Parsear el indice a un objeto
        const index: PropietarioPaqueteFresasVariedad = JSON.parse(
          res.value.value.toString()
        );
        // Recorrer todos los paquetes del indice (hay un indice por variedad)
        for (const paquete of index.paquetesFresas) {
          const transporte = paquete.transportePuntoVenta;

          // Verifica si ya fue recolectado pero aún no entregado
          if (transporte.datosRecoleccion && !transporte.datosEntrega) {
            // Registrar los datos de entrega
            paquete.transportePuntoVenta.datosEntrega = datos;

            // Construir ambas claves para el paquete
            const keyID = this.crearKeyID(paquete.idPaquete, paquete.idCosecha);
            const keyInversa = this.crearKeyCosecha(
              paquete.idCosecha,
              paquete.idPaquete
            );

            // Guardar el paquete actualizado en el ledger
            await ctx.stub.putState(
              keyID,
              Buffer.from(JSON.stringify(paquete))
            );
            await ctx.stub.putState(
              keyInversa,
              Buffer.from(JSON.stringify(paquete))
            );
          }
        }
      }

      if (res.done) break;
    }
  }

  private async leerUsuario(
    ctx: Context,
    metamaskAddress: string
  ): Promise<{ asset: Usuario; key: string }> {
    // Obtener el usuario del WorldState
    const iterator = await ctx.stub.getStateByPartialCompositeKey(
      "metamaskUsuario",
      [metamaskAddress]
    );
    while (true) {
      const res = await iterator.next();
      if (res.value && res.value.key) {
        // Obtener el rol del usuario para construir las claves
        const composite = ctx.stub.splitCompositeKey(res.value.key);
        const rol = composite.attributes[1];
        // Construir la clave principal del usuario
        const keyUsuario = ctx.stub.createCompositeKey("metamaskUsuario", [
          metamaskAddress,
          rol,
        ]);
        // Obtener el usuario con la clave principal
        const usuarioBytes = await ctx.stub.getState(keyUsuario);
        // Si el usuario existe, retornarlo
        if (usuarioBytes && usuarioBytes.length > 0) {
          await iterator.close();
          return {
            asset: JSON.parse(usuarioBytes.toString()),
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
}
