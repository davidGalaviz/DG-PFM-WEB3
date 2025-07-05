# 🔑 Construcción de las claves para los Assets

## Asset Usuario 👤

### 🔍 **Requerimientos de búsqueda**:

- Búsqueda por rol
- Búsqueda por Metamask address

Debido a que la búsqueda de usuarios se requiere por rol y por address de Metamask, se utilizarán ***derived keys***. Este método consiste en utilizar dos claves para un mismo *asset*, donde una de ellas actúa únicamente como puntero a la clave principal.

### 🛠️ Estructura final de la clave:

```
"usuario"/rol/address  
"usuario"/address/rol
```

---

## Asset LoteSemillas 🌱

### 🔍 **Requerimientos de búsqueda**:

- Búsqueda por propietario
- Búsqueda por propietario + variedad  
  *(Esta clase de búsquedas se logran mediante `getStateByPartialCompositeKey`)*

### 🛠️ Estructura final de la clave:

***Nota:*** El identificador de lote se incluye en la clave para asegurar unicidad.

```
"loteSemillas"/propietario/variedad/lote
```

---

## Asset CosechaFresas 🍓

### 🔍 **Requerimientos de búsqueda**:

- Búsqueda por propietario
- Búsqueda por propietario + variedad

### 🐾 **Requerimientos de trazabilidad:**

- Encontrar el lote de semillas del que proviene

### 🛠️ Estructura final de la clave:

***Nota:*** El identificador de cosecha se incluye para garantizar unicidad, y el `loteSemillasKey` permite establecer la trazabilidad.

```
"cosechaFresas"/propietario/variedad/cosechaID/loteSemillasKey
```

---

## Asset PaqueteFresas 📦

### 🔍 **Requerimientos de búsqueda**:

- **ADMIN & PROPIETARIO: Búsqueda por propietario**

    El propietario de un paquete de fresas cambia de la siguiente forma:

    Agricultor → Distribuidor → Minorista

    Por esta razón, el propietario no se especifica en la clave del *asset*. Para realizar la búsqueda de todos los paquetes que le pertenecen a un propietario, se utiliza el *asset* `PropietarioPaqueteFresasVariedad`.

    Esta búsqueda se logra mediante la búsqueda de los *assets* `PropietarioPaqueteFresasVariedad` con el propietario especificado en la clave y luego accediendo al valor (un arreglo de paquetes) de cada uno.

- **PROPIETARIO: Búsqueda por propietario + variedad**

    Se logra buscando el *asset* `PropietarioPaqueteFresasVariedad` con la clave `"propietario/variedad"` y accediendo a su valor (arreglo de paquetes)

- **MINORISTA PROPIETARIO: Búsqueda por propietario + paqueteID**

    Esto se logra buscando en los *assets* `paqueteFresas` aquel cuyo ID coincida con el buscado y luego verificando que el propietario almacenado en el *asset* coincida con el propietario consultado.

### 🐾 **Requerimientos de trazabilidad:**

- Encontrar la cosecha de fresas de la que proviene el paquete

    Esto se logra buscando la cosecha con el `cosechaFresasKey` especificado.

### 🛠️ Estructura final de la clave:

***Nota:*** `paqueteID` es un identificador único para el *asset*.

```
"paqueteFresas"/paqueteID/cosechaFresasKey
```

---

## ⭐ Asset PropietarioPaqueteFresasVariedad

### 🔍 **Requerimientos de búsqueda**:

- Buscar paquetes de fresas por propietario y variedad

### 🛠️ Estructura final de la clave:

```
"PropietarioPaqueteFresasVariedad"/metamaskAddress/variedad
```

---

## 📋 Trazabilidad completa lograda

🐾  
```
loteSemillas ← CosechaFresas ← Paquete de fresas
```
