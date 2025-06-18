# eclariti – App móvil Bluetooth/Offline Sync  
Versión **1.0.0** – jun-2025  
Autor: Clariti

---

## Índice
1. [Descripción general](#descripción-general)  
2. [Arquitectura & tecnologías](#arquitectura--tecnologías)  
3. [Requisitos previos](#requisitos-previos)  
4. [Clonado e instalación](#clonado-e-instalación)  
5. [Variables de entorno `.env`](#variables-de-entorno-env)  

---

## Descripción general
Aplicación React Native para **lectura de sensores de peso vía Bluetooth** con:
- Reconexión automática y uso de la MAC para `CE_PROD_<MAC>`.
- Formulario de producción y almacenamiento **offline** en SQLite.
- Sincronización automática/API REST cuando hay conexión.
- Soporte de **modo claro/oscuro**.  
- _Branding_ y paleta corporativa solicitada.

---

## Arquitectura & tecnologías
| Capa                | Tech / librerías principales                        |
|---------------------|----------------------------------------------------|
| UI & Navegación     | React Native 0.72, React Navigation 6              |
| Estado & contexto   | React Context + Hooks                              |
| Bluetooth           | `react-native-bluetooth-classic`                   |
| BD local            | `react-native-sqlite-storage` (tabla **weights**)  |
| Networking          | Axios                                             |
| Fechas/zonas horarias| Day.js (+ UTC/TZ plugins)                         |
| Build & firma       | Android Studio Giraffe / Gradle 8 / `jarsigner`    |

---

## Requisitos previos
* **Node.js ≥ 18** y **npm ≥ 9**  
* **Java 17** + **Android SDK** &emsp;(`ANDROID_HOME` configurada)  
* Dispositivo Android 8.0 (API 26) o superior.  
* Cuenta en Google Play Console con permisos de *App Manager* para subir artefactos.

---

## Clonado e instalación
```bash
# 1 · Clona tu fork / repo del cliente
git clone git@github.com:cliente/eclariti-app.git
cd eclariti-app

# 2 · Instala dependencias JS
npm ci         # o yarn install

# 3 · Instala pods (solo macOS/iOS)
# cd ios && pod install && cd ..

---

## Variables de entorno `.env`

| Variable    | Descripción                                                              | Ejemplo                                     |
|-------------|--------------------------------------------------------------------------|---------------------------------------------|
| `API_BASE`  | URL base del servicio REST                                               | `https://app.clarityenergy.cl/wapi`         |
| `API_TOKEN` | Token de autenticación                                                   | `9832e450ad....`          |
| `API_ORG`   | ID de organización                                                       | `magotteaux`                                |
| `API_CCOST` | ID de centro de costo                                                    | `H0M1DA54C7609`                              |
| `ID_MODULE` | *No se usa en ejecución* (la app genera `CE_PROD_<MAC>` automáticamente) | `DUMMY`                                     |
