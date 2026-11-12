# Puesto de Chance API

![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-29.x-C21325?logo=jest&logoColor=white)
![License](https://img.shields.io/badge/License-Privada-lightgrey)
![Quality Gate](https://img.shields.io/badge/Quality%20Gate-20%2F20%20tests%20passing-brightgreen)

API REST para la operación de un **puesto de chance y Baloto**. El sistema permite
autenticar usuarios con JWT, administrar sorteos, vender tiquetes de chance y Baloto,
validar apuestas, registrar resultados, liquidar y pagar premios, anular tiquetes y
cerrar la caja diaria de cada vendedor.

La aplicación está construida con **Node.js + Express 4** siguiendo una arquitectura
por capas:

```text
Rutas -> Controladores -> Servicios -> Almacén de datos (en memoria)
                  ^
          Middlewares (autenticación, autorización, errores)
```

> **Estado de persistencia:** la versión actual usa un almacén en memoria
> (`src/data/store.js`). Los datos se reinician cada vez que se reinicia el proceso.
> No se requiere motor de base de datos para ejecutar el proyecto.

---

## Tabla de contenido

1. [Prerrequisitos](#1-prerrequisitos)
2. [Instalación local](#2-instalación-local)
3. [Variables de entorno](#3-variables-de-entorno)
4. [Ejecución](#4-ejecución)
5. [Estructura del proyecto](#5-estructura-del-proyecto)
6. [Roles y usuarios de demostración](#6-roles-y-usuarios-de-demostración)
7. [Endpoints principales](#7-endpoints-principales)
8. [Reglas de negocio](#8-reglas-de-negocio)
9. [Pruebas](#9-pruebas)
10. [Matriz de Trazabilidad (RTM)](#10-matriz-de-trazabilidad-rtm)
11. [Documentación adicional](#11-documentación-adicional)

---

## 1. Prerrequisitos

| Herramienta | Versión mínima | Versión validada |
| :--- | :--- | :--- |
| Node.js | `>= 18` | `v24.19.0` |
| npm | `>= 9` | `11.17.0` |
| pnpm (alternativa) | `>= 8` | — |
| Git | `>= 2` | — |
| Motor de base de datos | No requerido | Almacén en memoria |

> Para producción se recomienda incorporar una base de datos persistente
> (por ejemplo, PostgreSQL); actualmente no existe cadena de conexión ni
> credenciales de servicios externos.

---

## 2. Instalación local

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd documentacionApi

# 2. Instalar dependencias (con pnpm)
pnpm install

# Alternativa con npm (hay package-lock.json en el repositorio)
npm install

# 3. Crear el archivo de variables de entorno
cp .env.example .env
```

En Windows PowerShell, el paso 3 se ejecuta así:

```powershell
Copy-Item .env.example .env
```

Edite `.env` y ajuste al menos `JWT_SECRET` antes de desplegar en un entorno real.

---

## 3. Variables de entorno

| Variable | Tipo | Valor por defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | string | `development` (plantilla) | Entorno de ejecución; con `test` se desactiva el log HTTP de morgan |
| `PORT` | integer | `3000` | Puerto HTTP del servidor |
| `JWT_SECRET` | string | `cambiar-este-secreto` | Secreto de firma de los tokens JWT |
| `JWT_EXPIRES_IN` | string | `8h` | Vigencia del token JWT |
| `ZONA_HORARIA` | string | `America/Bogota` | Zona horaria de negocio |
| `MINUTOS_ANULACION` | integer | `10` | Minutos para anular un tiquete |
| `MINUTOS_CIERRE_VENTAS` | integer | `15` | Minutos antes del sorteo en que cierran las ventas |
| `APUESTA_MIN_CHANCE` | integer | `500` | Valor mínimo de una apuesta de chance |
| `APUESTA_MAX_CHANCE` | integer | `50000` | Valor máximo de una apuesta de chance |
| `VALOR_BALOTO` | integer | `5700` | Valor de cada jugada de Baloto |
| `DIAS_CADUCIDAD_PREMIO` | integer | `365` | Días para reclamar un premio |

El archivo `.env.example` contiene todas las variables con valores de ejemplo.

---

## 4. Ejecución

```bash
# Modo desarrollo (reinicio automático con nodemon)
pnpm dev
# o: npm run dev

# Modo producción
pnpm start
# o: npm start
```

El servidor queda disponible en `http://localhost:3000` y el health check en
`http://localhost:3000/health`.

```json
{
  "estado": "ok",
  "hora": "2026-11-12T19:00:00.000Z"
}
```

---

## 5. Estructura del proyecto

```text
documentacionApi/
├── src/
│   ├── app.js                    # Configuración de Express y registro de rutas
│   ├── server.js                 # Arranque del servidor HTTP
│   ├── config/index.js           # Lectura y valores por defecto de variables de entorno
│   ├── controllers/              # Adaptadores HTTP (auth, sorteos, tickets, caja)
│   ├── middlewares/
│   │   ├── auth.js               # Autenticación JWT y autorización por rol
│   │   └── errorHandler.js       # Manejo centralizado de errores 404/400/500
│   ├── routes/index.js           # Definición de todos los endpoints
│   ├── services/                 # Lógica de negocio (auth, chance, baloto, tickets, caja, sorteos)
│   ├── data/store.js             # Almacén en memoria y datos semilla
│   └── utils/                    # AppError y utilidades de fechas
├── tests/                        # Pruebas con Jest + Supertest
├── .env.example
├── docs/
│   ├── API_DOCS.md
│   └── MATRIZ_TRAZABILIDAD.md
├── package.json
└── package-lock.json
```

---

## 6. Roles y usuarios de demostración

| Rol | Permisos principales |
| :--- | :--- |
| `ADMIN` | Crear sorteos, registrar resultados, consultar todos los tiquetes y anular tiquetes sin restricción de tiempo |
| `VENDEDOR` | Vender chance y Baloto, consultar sus tiquetes, anular sus tiquetes dentro de los 10 minutos, pagar premios y cerrar caja |

| Usuario | Contraseña | Rol |
| :--- | :--- | :--- |
| `admin` | `admin123` | `ADMIN` |
| `vendedor1` | `vende123` | `VENDEDOR` |
| `vendedor2` | `vende456` | `VENDEDOR` |

> Credenciales de demostración definidas en `src/data/store.js`. Deben reemplazarse
> antes de cualquier despliegue productivo.

---

## 7. Endpoints principales

URL base: `http://localhost:3000/api/v1`

| Verbo | Ruta | Rol | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Público | Estado del servicio |
| `POST` | `/auth/login` | Público | Inicio de sesión y emisión de JWT |
| `GET` | `/auth/perfil` | Autenticado | Perfil del usuario autenticado |
| `GET` | `/sorteos` | Autenticado | Lista sorteos (filtros `tipo`, `estado`) |
| `GET` | `/sorteos/:id` | Autenticado | Detalle de un sorteo |
| `POST` | `/sorteos` | `ADMIN` | Crea un sorteo |
| `POST` | `/sorteos/:id/resultado` | `ADMIN` | Registra resultado y liquida premios |
| `POST` | `/tickets/chance` | `VENDEDOR` | Vende un tiquete de chance |
| `POST` | `/tickets/baloto` | `VENDEDOR` | Vende un tiquete de Baloto |
| `GET` | `/tickets` | Autenticado | Lista tiquetes (filtros `fecha`, `estado`) |
| `GET` | `/tickets/:codigo` | Autenticado | Consulta un tiquete y su sorteo |
| `POST` | `/tickets/:codigo/anular` | Autenticado | Anula un tiquete |
| `POST` | `/tickets/:codigo/pagar` | `VENDEDOR` | Paga el premio de un tiquete |
| `GET` | `/caja/resumen` | Autenticado | Resumen diario de caja |
| `POST` | `/caja/cierre` | `VENDEDOR` | Registra el cierre de caja |

La documentación detallada con encabezados, cuerpos JSON, respuestas de éxito y
errores por código HTTP está en **[`docs/API_DOCS.md`](docs/API_DOCS.md)**.

---

## 8. Reglas de negocio

### Chance (`src/services/chanceService.js`)

- Número de 1 a 4 dígitos; modalidad `DIRECTO` o `COMBINADO`.
- `COMBINADO` solo aplica a 3 o 4 cifras y no admite números con todas las cifras iguales.
- Valor entre `APUESTA_MIN_CHANCE` y `APUESTA_MAX_CHANCE`, múltiplo de 100.
- Tabla de pagos: 4 cifras `x4500`, 3 cifras `x400`, 2 cifras `x50`, 1 cifra `x5`.
- En modalidad combinada el premio se divide entre el número de permutaciones.

### Baloto (`src/services/balotoService.js`)

- 5 números únicos entre 1 y 43, más una superbalota entre 1 y 16.
- Cada jugada cuesta `VALOR_BALOTO` (5700 por defecto).
- Premios: `5+1` acumulado, `5+0` 50.000.000, `4+1` 2.000.000, `4+0` 150.000,
  `3+1` 40.000, `3+0` 12.000, `2+1` 9.000, `1+1` y `0+1` 5.700.

### Tiquetes y caja

- Las ventas cierran `MINUTOS_CIERRE_VENTAS` minutos antes del sorteo.
- El vendedor puede anular sus tiquetes dentro de `MINUTOS_ANULACION`; el `ADMIN` no tiene esa restricción.
- El premio se paga una sola vez y caduca a los `DIAS_CADUCIDAD_PREMIO` días desde el juego.
- El cierre de caja compara el efectivo reportado con el saldo esperado y lo clasifica
  como `CUADRADA`, `SOBRANTE` o `FALTANTE`; solo se permite un cierre por vendedor y fecha.

---

## 9. Pruebas

```bash
pnpm test
# o: npm test
```

Resultado esperado de la suite actual:

```text
Test Suites: 5 passed, 5 total
Tests:       20 passed, 20 total
```

| Archivo | Enfoque |
| :--- | :--- |
| `tests/auth.test.js` | Login, credenciales inválidas y rutas protegidas |
| `tests/chance.test.js` | Reglas y cálculo de premios de chance |
| `tests/baloto.test.js` | Jugadas aleatorias, validaciones y premios de Baloto |
| `tests/tickets.test.js` | Venta, anulación, resultado y pago de premios |
| `tests/caja.test.js` | Resumen, cierre de caja y creación de sorteos |

---

## 10. Matriz de Trazabilidad (RTM)

Copia de la matriz formal. La versión maestra y el detalle de brechas están en
**[`docs/MATRIZ_TRAZABILIDAD.md`](docs/MATRIZ_TRAZABILIDAD.md)**.

| ID HU | Descripción del Requisito | Módulo / Controlador | Caso de Prueba Asociado | Estado QA |
| :--- | :--- | :--- | :--- | :--- |
| HU-001 | Inicio de sesión con credenciales y obtención de token JWT | `authController.js` / `authService.js` | `test_login_exitoso()`, `test_login_credenciales_invalidas()` | Aprobado |
| HU-002 | Protección de rutas y control de acceso por rol (`ADMIN`/`VENDEDOR`) | `middlewares/auth.js` (`autenticar`, `permitir`) | `test_ruta_protegida_sin_token()`, `test_admin_no_vende()` | Aprobado |
| HU-003 | Consulta del perfil del usuario autenticado | `authController.js` / `authService.perfil()` | Sin prueba automatizada dedicada | Pendiente |
| HU-004 | Creación y consulta de sorteos de chance y Baloto | `sorteoController.js` / `sorteoService.js` | `test_admin_crea_sorteo()` | Parcial |
| HU-005 | Registro de resultados y liquidación automática de tiquetes | `sorteoController.js` / `sorteoService.registrarResultado()` | `test_resultado_y_pago_premio()` | Aprobado |
| HU-006 | Validación de reglas de apuestas de chance y jugadas de Baloto | `chanceService.js` / `balotoService.js` | `test_validacion_apuesta_invalida()`, `test_jugada_numeros_repetidos()`, `test_jugada_aleatoria_valida()` | Aprobado |
| HU-007 | Venta de tiquetes de chance con cálculo de total y código único | `ticketController.js` / `ticketService.venderChance()` | `test_venta_chance()`, `test_venta_sorteo_cerrado()` | Aprobado |
| HU-008 | Venta de tiquetes de Baloto (jugadas manuales y aleatorias) | `ticketController.js` / `ticketService.venderBaloto()` | `test_venta_baloto()`, `test_premio_por_aciertos()` | Aprobado |
| HU-009 | Consulta y listado de tiquetes con filtros por fecha y estado | `ticketService.consultar()` / `ticketService.listar()` | `test_resultado_y_pago_premio()` (solo consulta) | Parcial |
| HU-010 | Anulación de tiquetes con validación de propiedad y tiempo | `ticketController.js` / `ticketService.anular()` | `test_anulacion_ticket()`, `test_anulacion_fuera_de_tiempo()` | Aprobado |
| HU-011 | Pago único de premios con validación de caducidad | `ticketController.js` / `ticketService.pagarPremio()` | `test_resultado_y_pago_premio()` | Parcial |
| HU-012 | Resumen y cierre diario de caja del vendedor | `cajaController.js` / `cajaService.js` | `test_resumen_caja_diario()`, `test_cierre_caja_con_faltante()` | Aprobado |
| HU-013 | Verificación de disponibilidad del servicio | `app.js` (`GET /health`) | Sin prueba automatizada dedicada | Pendiente |
| HU-014 | Respuestas de error uniformes (400, 401, 403, 404, 409, 410, 500) | `middlewares/errorHandler.js` / `utils/AppError.js` | Sin prueba automatizada dedicada | Pendiente |

### Convención de estados QA

| Estado | Significado |
| :--- | :--- |
| Aprobado | Implementado y cubierto por pruebas automatizadas exitosas |
| Parcial | Implementado, con cobertura automatizada parcial |
| Pendiente | Implementado sin prueba dedicada o brecha identificada |

---

## 11. Documentación adicional

| Documento | Contenido |
| :--- | :--- |
| [`docs/API_DOCS.md`](docs/API_DOCS.md) | Referencia completa de endpoints, cuerpos, respuestas y errores |
| [`docs/MATRIZ_TRAZABILIDAD.md`](docs/MATRIZ_TRAZABILIDAD.md) | RTM, requerimientos funcionales, evidencia de pruebas y plan de QA |
| `.env.example` | Plantilla de variables de entorno |

---

## Licencia

Proyecto privado (`"private": true` en `package.json`). Distribución y uso interno;
no se concede licencia de uso público.
