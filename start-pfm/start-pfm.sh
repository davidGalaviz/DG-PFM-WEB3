#!/bin/bash
set -e

# Add fabric binaries from ../fabric-samples/bin to PATH
export PATH=$PATH:$(realpath ../fabric-samples/bin)


# -----------------------
# CONFIGURACIÓN
# -----------------------
CHANNEL_NAME="mychannel"
CHAINCODE_NAME="fresas-traza-chaincode"
CHAINCODE_LANG="typescript"
CHAINCODE_PATH="../../chaincode/"
FABRIC_SAMPLES_DIR="../fabric-samples/test-network"

CA_URL="https://localhost:7054"
CA_TLS_CERT="/organizations/fabric-ca/org1/tls-cert.pem"
CA_NAME="ca-org1"
FABRIC_CA_CLIENT_HOME=$FABRIC_SAMPLES_DIR/organizations/peerOrganizations/org1.example.com/

# ADMIN INICIAL
ADMIN_ID="AdminApp"
ADMIN_PW="adminApppw"
ADMIN_MSPID="Org1MSP"
ADMIN_ADDR="0xABCDEF..."  # Dirección metamask a mapear con admin inicial

# Bootstrap admin identity
BOOTSTRAP_IDENTITY="Admin@org1.example.com"

# -----------------------
# PASO 1: Levantar red
# -----------------------
cd "$FABRIC_SAMPLES_DIR"

echo "🗑️ 1. Eliminando contenedores de chaincode existentes..."
echo $(docker ps -q --filter "name=fresas-traza-chaincode" | xargs -r docker stop)
echo "✅ Contenedores eliminados."

echo "🧹 2. Limpiando cualquier red existente"
./network.sh down
echo "✅ Todo límpio"

echo "🚀 2. Levantando red con canal '${CHANNEL_NAME}' y Fabric CA"
./network.sh up createChannel -ca -c "$CHANNEL_NAME"
echo "✅ Red levantada, canal creado y ca iniciado."

# -----------------------
# PASO 2: Deploy CCaaS
# -----------------------
echo "📦 3. Deploy del Chaincode As A Service (CCaaS)"
./network.sh deployCCAAS -ccn "$CHAINCODE_NAME" -ccp "$CHAINCODE_PATH" -ccl "$CHAINCODE_LANG"
echo "✅ Deploy del chaincode exitoso."

echo "🆕 4. Registrando identidad Fabric 'AdminApp' desde Admin@org1.example.com"
export FABRIC_CA_CLIENT_HOME=$PWD/organizations/peerOrganizations/org1.example.com
# Esto asegura que estás usando la identidad bootstrap generada por network.sh
fabric-ca-client register \
  -u https://admin:adminpw@localhost:7054 \
  --caname "$CA_NAME" \
  --id.name "$ADMIN_ID" \
  --id.secret "$ADMIN_PW" \
  --id.type client \
  --tls.certfiles "$PWD$CA_TLS_CERT" \
  --id.affiliation "org1.department1" \
  --id.attrs "role=admin:ecert, metamaskAddress=0x070aabF219f35bF191C0d866F412d39d92ba2f79:ecert"

echo "🧾 5. Enroll de identidad '$ADMIN_ID'"
fabric-ca-client enroll \
  -u https://$ADMIN_ID:$ADMIN_PW@localhost:7054 \
  --caname "$CA_NAME" \
  -M "$FABRIC_CA_CLIENT_HOME/msp" \
  --tls.certfiles "$PWD$CA_TLS_CERT"\
  --enrollment.attrs "role, metamaskAddress"
  
# -----------------------
# PASO 4: Ejecutar createInitialAdmin desde bootstrap
# -----------------------
echo "🏁 6. Ejecutando 'createInitialAdmin' con bootstrap admin"
cd "../../start-pfm"
# Aquí llamamos un script de Node.js/TS que ejecuta la transacción usando Admin@org1
# Suponemos que ya tienes este script llamado `ejecutar-tx-admin.ts`

npx ts-node ./ejecutar-tx-admin.ts --identity "Admin@org1.example.com" --mspid "Org1MSP" --channel "mychannel" --contract "AdminContrato" --tx "createInitialAdmin"

echo "✅ Red lista e identidad adminApp creada."