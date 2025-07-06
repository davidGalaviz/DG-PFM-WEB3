import path from "path";
import fs from "fs";
import * as crypto from "crypto";
import FabricCAServices from "fabric-ca-client";
import { signers } from "@hyperledger/fabric-gateway";
import { connectGateway } from "@/lib/gateway";

const caURL = "https://localhost:7054";
const caName = "ca.org1.example.com";
const mspId = "Org1MSP";
const tlsCertPath = path.resolve(__dirname, "../../../fabric-samples/test-network/organizations/fabric-ca/org1/tls-cert.pem");
export async function registrarUsuario(userId: string, metamaskAddress: string, rol: string, nombre: string) {
  const tlsCert = fs.readFileSync(tlsCertPath);
  const ca = new FabricCAServices(caURL, { trustedRoots: tlsCert, verify: false }, caName);

  const adminCert = fs.readFileSync("ruta/cert.pem").toString();
  const adminKeyPem = crypto.createPrivateKey({ key: fs.readFileSync("ruta/priv_sk", 'utf8').toString() });


  // 
  const adminIdentity = {
    credentials: {
      certificate: adminCert,
      privateKey: adminKeyPem,
    },
    mspId,
    type: "X.509" as const,
  };

  const adminSigner = signers.newPrivateKeySigner(
    adminKeyPem
  );

  const userSecret = await ca.register(
    {
      affiliation: "",
      enrollmentID: userId,
      role: "client",
      attrs: [{ name: "role", value: rol, ecert: true }],
    },
    adminUser
  );

  await ca.enroll({
    enrollmentID: userId,
    enrollmentSecret: userSecret,
  });

  // 2. Conexión con Fabric Gateway
  const gateway = await connectGateway("admin", mspId);
  const network = gateway.getNetwork("mychannel");
  const contract = network.getContract("mi-chaincode");

  // 3. Ejecutar transacción en chaincode
  await contract.submitTransaction("registrarUsuario", nombre, metamaskAddress, rol, userId);
  console.log("✅ Transacción registrarUsuario ejecutada con éxito");
}