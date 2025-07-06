# 🍓 Trazabilidad Fresas WEB 3
Sistema de trazabilidad de la cadena de suministro de fresas usando tecnología blockchain con Hyperledger Fabric, una aplicación web construida en Next.js, y contenedores Docker para la infraestructura. El objetivo es permitir registrar y consultar la trazabilidad de los productos desde su origen hasta el consumidor final.

## 🛠️ Tecnologías Utilizadas
- Next.js – Framework de React
- ⛓️ Hyperledger Fabric – Blockchain
- 🐳 Docker – Contenedores y redes
- 🐧 WSL2 (Windows Subsystem for Linux 2) – Entorno Linux sobre Windows

## ⚙️ Instalación y Configuración
### 1. Clonar el repositorio:
``` bash
git clone https://github.com/davidGalaviz/DG-PFM-WEB3.git
```
### 2. Estructura esperada del proyecto
Algunas carpetas deben ubicarse en WSL y otras en el sistema de archivos de Windows. A continuación, se detalla la distribución correcta:
**Nota**: puede ser que funcione con todas las carpetas en WSL, pero no está probado.

📁 Dentro de WSL (Linux):
```
/DG-PFM-WEB3
  ├── chaincode       -> Contratos inteligentes en TypeScript
  └── start-pfm       -> Scripts para levantar la red de Fabric
```
📁 Dentro de Windows: 
```
/DG-PFM-WEB3
  /hlf-app          -> Aplicación next.js
```
## ⬆️ Iniciar la red
1. Inicia Docker
2. Posiciónate en la carpeta **/DG-PFM-WEB3**  (dentro de WSL, donde está la subcarpeta start-pfm)
3. Descargar el script de instalación para los fabric-samples
4. Instalar fabric samples, binarios e imagenes
   ```
   curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh
   ```
5. Ejecuta el script para instalar los samples, binarios e imágenes
   ```
   ./install-fabric.sh docker samples binary
   ```
6. Cambia el Endorsment Policy en el script **deployCCAAS.sh**
   Cambia la línea 18 del script por la siguiente:
   ```
   CC_END_POLICY="OR('Org1MSP.member')"
   ```
7. Entra a la carpeta **start-pfm:**
   ```
   cd start-pfm
   ```
8. Añade permisos de ejecución al script start-pfm.sh
   ```
   chmod +x start-pfm.sh
   ```
9. Instala las dependencias del proyecto start-pfm
   ```
   npm install
   ```
10. Ejecuta el script para levantar la red
   ```
   ./start-pfm.sh
   ```
### Comprabación de que todo salío bien
Al final debes ver algo como lo siguiente en docker:

