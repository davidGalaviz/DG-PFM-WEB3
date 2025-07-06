import { connect, Gateway, Identity, signers } from '@hyperledger/fabric-gateway';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as grpc from '@grpc/grpc-js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// CLI options
const argv = yargs(hideBin(process.argv)).options({
  identity: { type: 'string', demandOption: true, describe: 'Identidad de Fabric (ej. Admin@org1.example.com)' },
  mspid: { type: 'string', demandOption: true, describe: 'MSP ID (ej. Org1MSP)' },
  channel: { type: 'string', demandOption: true, describe: 'Nombre del canal (ej. mychannel)' },
  contract: { type: 'string', demandOption: true, describe: 'Nombre del chaincode' },
  tx: { type: 'string', demandOption: true, describe: 'Nombre de la transacción a ejecutar' },
}).parseSync();


// Guardar los argumentos obtenidos en constantes
const identityLabel = argv.identity as string;
const mspId = argv.mspid as string;
const channelName = argv.channel as string;
const contractName = argv.contract as string;
const txName = argv.tx as string;

// Nombre de la organización 
const ORG_NAME = 'org1.example.com';
// Path hacia el usuario admin boostrap
const USERS_PATH = path.join(
  __dirname,
  '..',
  'fabric-samples',
  'test-network',
  'organizations',
  'peerOrganizations',
  ORG_NAME,
  'users',
  identityLabel,
  'msp'
);


async function main() {
  console.log(`🔐 Ejecutando transacción '${txName}' como ${identityLabel}...`);

  // Leer cert y clave privada del admin boostrap
  const certPath = path.join(USERS_PATH, 'signcerts', fs.readdirSync(path.join(USERS_PATH, 'signcerts'))[0]);
  const keyPath = path.join(USERS_PATH, 'keystore', fs.readdirSync(path.join(USERS_PATH, 'keystore'))[0]);

  // Leer el certificado del admin boostrap
  const certPem = fs.readFileSync(certPath);
  // Leer el archivo de la clave privada del admin boostrap
  const keyPem = fs.readFileSync(keyPath, 'utf8');
  // Convertir la clave en un objeto privateKey
  const privateKey = crypto.createPrivateKey({ key: keyPem });
  // Crear un objeto firmador con la clave privada del admin bootstrap
  const signer = signers.newPrivateKeySigner(privateKey);

  // Crear la identidad del admin boostrap
  const identity: Identity = {
    mspId,
    credentials: certPem,
  };

  // Configuraciones para la conexión al peer
  // Url del peer
  const endpoint = 'localhost:7051'
  // Host alias del peer
  const hostAlias = 'peer0.org1.example.com'
  // Path hacia los certificados tls del peer
  const tlsCertPath = path.resolve(
    __dirname,
    '..',
    'fabric-samples',
    'test-network',
    'organizations',
    'peerOrganizations',
    'org1.example.com',
    'peers',
    'peer0.org1.example.com',
    'tls',
    'ca.crt'
  )
  // Leemos el certificado tls del peer
  const tlsCert = fs.readFileSync(tlsCertPath);
  // Creamos unas credenciales usando el certificado tls
  const credentials = grpc.credentials.createSsl(tlsCert);

  // Creamos un nuevo cliente grpc para la conexión al peer
  const client = new grpc.Client(endpoint, credentials, {
    'grpc.ssl_target_name_override': hostAlias,
  });

  // Nos conectamos al peer con el cliente grpc, la identidad del bootstrap admin y el objeto firmador del boostrap admin
  const gateway: Gateway = await connect({
    client,
    identity,
    signer,
  });

  // Obtenemos la conexión al canal 
  const network = gateway.getNetwork(channelName);
  // Obtenemos el contrato
  const contract = network.getContract('fresas-traza-chaincode', contractName);

  // Intentamos hacer la transacción 
  try {
    let result: Uint8Array;
    result = await contract.submitTransaction(txName);
    console.log(`✅ Transacción ejecutada exitosamente`);
    gateway.close();
  } catch (error) {
    // Si ocurre un error con la transacción lo imprimimos
    console.error(`❌ Error ejecutando transacción '${txName}':`, error);
    process.exit(1);
  }
}

main();
