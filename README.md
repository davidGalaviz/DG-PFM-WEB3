# 🍓 Trazabilidad Fresas WEB 3
Sistema de trazabilidad de la cadena de suministro de fresas usando tecnología blockchain con Hyperledger Fabric, una aplicación web construida en Next.js, y contenedores Docker para la infraestructura. El objetivo es permitir registrar y consultar la trazabilidad de los productos desde su origen hasta el consumidor final.

## 🛠️ Tecnologías Utilizadas
- Next.js – Framework de React
- ⛓️ Hyperledger Fabric – Blockchain
- 🐳 Docker – Contenedores y redes
- 🐧 WSL2 (Windows Subsystem for Linux 2) – Entorno Linux sobre Windows

## ⚙️ Instalación y Configuración
Este proyecto se construyo en windows con WLS2.
### 1. Clonar el repositorio:
``` bash
git clone https://github.com/davidGalaviz/DG-PFM-WEB3.git
```
### 2. Estructura esperada del proyecto
Algunas carpetas deben ubicarse en WSL y otras en el sistema de archivos de Windows. A continuación, se detalla la distribución correcta:
**Nota**: puede ser que funcione con todas las carpetas en WSL, pero no esta probrado

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
