import { connect, Identity, signers, Gateway } from '@hyperledger/fabric-gateway';
import * as fs from 'fs';
import * as grpc from '@grpc/grpc-js';
import * as crypto from 'crypto';

// Función para conectarse al gateway
export async function connectGateway(identityLabel: string, mspId: string): Promise<Gateway> {
  const cert = fs.readFileSync(`wallet/${identityLabel}/cert.pem`);
  const keyPem = fs.readFileSync(`wallet/${identityLabel}/key.pem`, 'utf8');
  const privateKey = crypto.createPrivateKey({ key: keyPem });
  const signer = signers.newPrivateKeySigner(privateKey);

  const { endpoint, hostAlias, tlsCertPath } = getPeerInfoByMsp(mspId);
  const tlsCert = fs.readFileSync(tlsCertPath);
  const credentials = grpc.credentials.createSsl(tlsCert);
  const client = new grpc.Client(endpoint, credentials, {
    'grpc.ssl_target_name_override': hostAlias,
  });

  const identity: Identity = {
    mspId,
    credentials: cert,
  };

  return connect({ client, identity, signer });
}

// Función para obtener los datos del peer según el mspID
function getPeerInfoByMsp(mspId: string) {
  switch (mspId) {
    case 'Org1MSP':
      return {
        endpoint: 'localhost:7051',
        hostAlias: 'peer0.org1.example.com',
        tlsCertPath: 'network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt',
      };
    case 'Org2MSP':
      return {
        endpoint: 'localhost:9051',
        hostAlias: 'peer0.org2.example.com',
        tlsCertPath: 'network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt',
      };
    default:
      throw new Error(`MSP desconocido: ${mspId}`);
  }
}