/* 
    Este archivo se encarga de conectarse al fabric gateway con la identidad del peer 1 de la org 1
*/

// Librería para conexiones grpc
import * as grpc from "@grpc/grpc-js";
// Importamos signers para firmar las solicitudes de transacción
// y connect para conectarnos al gateway
import { signers, connect } from '@hyperledger/fabric-gateway'
// Librería para resolver paths
import path from 'node:path';
// Librería file system para leer archivos y directorios
import fs from 'node:fs';
// 
import crypto from 'node:crypto';
//
import { dirname } from 'node:path';

// 
const currentDirName = dirname("."); 
const ROOT = path.resolve(currentDirName, '../identities');
const BASE = `${ROOT}/organizations/peerOrganizations/org1.example.com`
// Obtener identidad del usuario 1 de la organización 1
const CERT_USER = fs.readFileSync(`${BASE}/users/User1@org1.example.com/msp/signcerts/User1@org1.example.com-cert.pem`).toString()
const key_dir_path = path.resolve(`${BASE}/user/User1@org1.example.com/msp/keystore`);
const key_dir_files = fs.readdirSync(key_dir_path);
const user_key_path = path.join(key_dir_path, key_dir_files[0]);
const USER_KEY = fs.readFileSync(user_key_path).toString();
// Variables para conexión a la red
const CHANNEL = "channel1";
const CHAINCODE = "fresa-traza";
const MSPID = "Org1MSP";
// Dastos del peer al que nos vamos a conectar
const peerEndpoint = "http//:localhost:7051";
const peerHostAlias = "peer0.org1.example.com";

// Algo(como una contraseña/credenciales) que nos permite conectarnos al peer
const tlsCert = fs.readFileSync(`${BASE}/peers/peer0.org1.example.com/tls/ca.crt`).toString();

//  Función para una nueva conexión grpc
async function newGrpcConnection() {
    const tlsCredentials = grpc.credentials.createSsl(Buffer.from(tlsCert));

    // Creamos una nueva conexión grpc/nuevo cliente grpc y la retornamos
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias
    })
}

// Función para la conexión al fabric gateway
export async function connectToFabric(contractName:string) {
    let clientGrpc:grpc.Client;
    // Conectarse a el peer
    try {
        clientGrpc = await newGrpcConnection()
    } catch (error) {
        console.error(`Error: ${error}`);
        throw error;
    }

    // Creación de la identidad del usuario
    const userIdentity = {
        // El mspId es el identificador de la organización a la que pertenece el usuario.
        mspId: MSPID,
        // La identidad del usuario (su certificado X.509)
        credentials: Buffer.from(CERT_USER),
    }
    // Creación de la llave privada del usuario
    const privateKey = crypto.createPrivateKey(Buffer.from(USER_KEY));
    // Creación de un frimador con la clave privada del usuario
    const signer = signers.newPrivateKeySigner(privateKey);

    try {
        // Conectamos al gateway con el cliente grpc, la identidad del usuario y el firmador
        // El firmador es un objeto que firma con la clave privada especificada enteriormente(la del usuario)
        // Fabric necesita el firmador para firmar las solicitudes de transacción.
        const gateway = connect({ client:clientGrpc, identity:userIdentity, signer });
        // Nos coneectamos al canal
        const network = gateway.getNetwork(CHANNEL);

        // Obtenemos el contrato especificado del chaincode.
        const contract = network.getContract(CHAINCODE, contractName);
        return contract;
    } catch (error){
        console.error(`Error: ${error}`);
        throw error;
    }
}