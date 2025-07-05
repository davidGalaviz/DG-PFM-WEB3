import { FileSystemWallet, X509WalletMixin } from "fabric-network";
import FabricCAServices from "fabric-ca-client";
import path from "path";
import { connectGateway } from "@/lib/gateway";
import db from "@/lib/db";

const walletPath = path.resolve(__dirname, "../wallet");
const caURL = "https://localhost:7054"; // cambia según tu setup

export async function registrarIdentidadFabric(
  identityLabel: string,
  affiliation: string = "org1.department1",
  rol: string,
  metamaskAddress: string,
  nombre: string
) {
  // Configuración del CA
  const ca = new FabricCAServices(caURL);
  // Configuración del wallet
  // ❓ ¿Que retorna FileSystemWallet?
  const wallet = new FileSystemWallet(walletPath);

  // Verifica si ya existe la identidad
  const userExists = await wallet.exists(identityLabel);
  if (userExists) {
    console.log(`Identidad ${identityLabel} ya existe`);
    return;
  }

  // Usa una identidad admin para registrar al nuevo usuario
  const adminExists = await wallet.exists("admin");
  if (!adminExists) throw new Error("Identidad admin no encontrada en wallet");

  const adminIdentity = await wallet.export("admin");
  const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
  const adminUser = await provider.getUserContext(adminIdentity, "admin");

  // 1. Registrar nuevo usuario en el CA
  const secret = await ca.register(
    {
      affiliation,
      enrollmentID: identityLabel,
      role: "client",
      attrs: [
        { name: "rol", value: rol, ecert: true },
        { name: "metamask", value: metamaskAddress, ecert: true },
        { name: "nombre", value: nombre, ecert: true },
      ],
    },
    adminUser
  );

  // 2. Inscribir al nuevo usuario
  const enrollment = await ca.enroll({
    enrollmentID: identityLabel,
    enrollmentSecret: secret,
  });

  // 3. Importar identidad en el wallet
  const userIdentity = X509WalletMixin.createIdentity(
    "Org1MSP",
    enrollment.certificate,
    enrollment.key.toBytes()
  );
  await wallet.import(identityLabel, userIdentity);
  console.log(`✅ Identidad ${identityLabel} registrada e importada`);
}

export async function getIdentityLabel(
  metamaskAddress: string
): Promise<string | null> {
  const res = await db.query(
    "SELECT identity_label FROM identity_map WHERE metamask_address = $1",
    [metamaskAddress]
  );
  return res.rows[0]?.identity_label || null;
}

export async function registrarUsuario(
  nombre: string,
  metamaskAddress: string,
  rol: string
) {
  const gateway = await connectGateway("admin", "Org1MSP");
  const network = gateway.getNetwork("mychannel");
  const contract = network.getContract(
    "fresas-traza",
    "AdminContrato"
  );

  const result = await contract.submitTransaction(
    "registrarUsuario",
    nombre,
    metamaskAddress,
    rol
  );

  // Guardar la relación en Postgres
  await db.query(
    `INSERT INTO identity_map (metamask_address, identity_label, rol, nombre)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (metamask_address) DO UPDATE SET identity_label = EXCLUDED.identity_label, rol = EXCLUDED.rol, nombre = EXCLUDED.nombre`,
    [metamaskAddress, `user-${metamaskAddress}`, rol, nombre]
  );

  gateway.close();
  return result.toString();
}

export async function eliminarUsuario(metamaskAddress: string) {
  const gateway = await connectGateway("admin", "Org1MSP");
  const network = gateway.getNetwork("mychannel");
  const contract = network.getContract(
    "fresas-traza",
    "AdminContrato"
  );

  const result = await contract.submitTransaction(
    "eliminarUsuario",
    metamaskAddress
  );
  gateway.close();
  return result.toString();
}

export async function leerUsuario(metamaskAddress: string) {
  const identityLabel = await getIdentityLabel(metamaskAddress);
  if (!identityLabel) throw new Error("Identidad no registrada");

  const gateway = await connectGateway("admin", "Org1MSP");
  const network = gateway.getNetwork("mychannel");
  const contract = network.getContract(
    "fresas-traza",
    "AdminContrato"
  );

  const result = await contract.submitTransaction(
    "leerUsuario",
    metamaskAddress
  );
  gateway.close();
  return JSON.parse(result.toString());
}

export async function listarUsuariosPorRol(rol: string, identityLabel: string) {
  const gateway = await connectGateway(identityLabel, "Org1MSP");
  const network = gateway.getNetwork("mychannel");
  const contract = network.getContract(
    "fresas-traza",
    "AdminContrato"
  );

  const result = await contract.evaluateTransaction(
    "listarUsuariosPorRol",
    rol
  );
  gateway.close();
  return JSON.parse(result.toString());
}
