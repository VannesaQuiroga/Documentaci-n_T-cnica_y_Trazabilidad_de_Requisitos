# API Docs - Puesto de Chance API

Documentación de referencia de la API REST del sistema de puesto de chance y Baloto.
El proyecto **no incluye Swagger/OpenAPI**; esta guía documenta manualmente todos los
endpoints expuestos en `src/routes/index.js`.

---

## 1. Información general

| Aspecto | Valor |
| :--- | :--- |
| URL base | `http://localhost:3000/api/v1` |
| Formato de intercambio | JSON (`Content-Type: application/json`) |
| Autenticación | JWT en el encabezado `Authorization: Bearer <token>` |
| Roles | `ADMIN`, `VENDEDOR` |
| Zona horaria de negocio | `America/Bogota` (configurable con `ZONA_HORARIA`) |
| Almacenamiento | En memoria (`src/data/store.js`); los datos se reinician al reiniciar el proceso |
| Monitoreo | `GET /health` (fuera del prefijo `/api/v1`) |

### 1.1 Encabezados comunes

```http
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

`Authorization` es obligatorio en todas las rutas excepto `POST /api/v1/auth/login`
y `GET /health`.

### 1.2 Formato de error

Todos los errores se devuelven con la siguiente estructura:

```json
{
  "error": "Descripción del error"
}
```

Casos especiales:

- Cuerpo JSON mal formado: `400` con `{ "error": "JSON mal formado" }`.
- Ruta inexistente: `404` con `{ "error": "Ruta GET /api/v1/no-existe no existe" }`.
- Error inesperado: `500` con `{ "error": "Error interno del servidor" }`.

### 1.3 Códigos de estado utilizados

| Código | Significado |
| :--- | :--- |
| `200` | Operación exitosa |
| `201` | Recurso creado |
| `400` | Datos inválidos o JSON mal formado |
| `401` | Token ausente, inválido o credenciales incorrectas |
| `403` | Sin permisos para la acción o usuario inactivo |
| `404` | Recurso no encontrado |
| `409` | Conflicto con el estado actual del recurso |
| `410` | Premio caducado |
| `500` | Error interno del servidor |

### 1.4 Usuarios de demostración

| Usuario | Contraseña | Rol |
| :--- | :--- | :--- |
| `admin` | `admin123` | `ADMIN` |
| `vendedor1` | `vende123` | `VENDEDOR` |
| `vendedor2` | `vende456` | `VENDEDOR` |

> Credenciales de prueba definidas en `src/data/store.js`. No deben usarse en producción.

---

## 2. Salud del servicio

### `GET /health`

Verifica que el servicio esté en ejecución. No requiere autenticación y no usa el
prefijo `/api/v1`.

**Respuesta `200 OK`**

```json
{
  "estado": "ok",
  "hora": "2026-11-12T19:00:00.000Z"
}
```

---

## 3. Autenticación

### 3.1 `POST /api/v1/auth/login`

Inicia sesión con credenciales y devuelve un token JWT. Público.

**Body**

```json
{
  "usuario": "vendedor1",
  "password": "vende123"
}
```

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `usuario` | string | Sí | Nombre de usuario registrado |
| `password` | string | Sí | Contraseña en texto plano |

**Respuesta `200 OK`**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 2,
    "usuario": "vendedor1",
    "nombre": "Ana Pérez",
    "rol": "VENDEDOR"
  }
}
```

**Errores**

| Código | Causa |
| :--- | :--- |
| `400` | Falta `usuario` o `password` |
| `401` | Usuario inexistente o contraseña incorrecta |
| `403` | Usuario inactivo |
| `500` | Error interno |

### 3.2 `GET /api/v1/auth/perfil`

Devuelve el perfil del usuario autenticado.

**Headers**: `Authorization: Bearer <token>`

**Respuesta `200 OK`**

```json
{
  "id": 2,
  "usuario": "vendedor1",
  "nombre": "Ana Pérez",
  "rol": "VENDEDOR"
}
```

**Errores**: `401` token requerido/inválido, `500` error interno.

---

## 4. Sorteos

### 4.1 `GET /api/v1/sorteos`

Lista sorteos. Requiere autenticación (cualquier rol).

**Query params (opcionales)**

| Parámetro | Valores | Descripción |
| :--- | :--- | :--- |
| `tipo` | `CHANCE`, `BALOTO` | Filtra por tipo de sorteo |
| `estado` | `ABIERTO`, `JUGADO` | Filtra por estado |

**Ejemplo**: `GET /api/v1/sorteos?tipo=CHANCE&estado=ABIERTO`

**Respuesta `200 OK`**

```json
[
  {
    "id": 1,
    "tipo": "CHANCE",
    "nombre": "Lotería de Bogotá",
    "fecha": "2026-11-13T19:00:00.000Z",
    "estado": "ABIERTO",
    "resultado": null,
    "acumulado": 0
  }
]
```

### 4.2 `GET /api/v1/sorteos/:id`

Obtiene el detalle de un sorteo. Requiere autenticación (cualquier rol).

**Respuesta `200 OK`**: objeto del sorteo (misma estructura del listado).

**Errores**: `401`, `404` si el sorteo no existe, `500`.

### 4.3 `POST /api/v1/sorteos`

Crea un sorteo. Solo rol `ADMIN`.

**Headers**: `Authorization: Bearer <token_admin>`

**Body**

```json
{
  "tipo": "CHANCE",
  "nombre": "Lotería del Valle",
  "fecha": "2026-12-01T23:00:00.000Z",
  "acumulado": 0
}
```

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `tipo` | string | Sí | `CHANCE` o `BALOTO` |
| `nombre` | string | Sí | Nombre del sorteo |
| `fecha` | string (ISO 8601) | Sí | Fecha futura del sorteo |
| `acumulado` | number | No | Acumulado inicial; solo aplica a `BALOTO` |

**Respuesta `201 Created`**

```json
{
  "id": 4,
  "tipo": "CHANCE",
  "nombre": "Lotería del Valle",
  "fecha": "2026-12-01T23:00:00.000Z",
  "estado": "ABIERTO",
  "resultado": null,
  "acumulado": 0
}
```

**Errores**

| Código | Causa |
| :--- | :--- |
| `400` | Tipo inválido, nombre ausente, fecha inválida o fecha no futura |
| `401` | Token ausente o inválido |
| `403` | Rol distinto de `ADMIN` |
| `500` | Error interno |

### 4.4 `POST /api/v1/sorteos/:id/resultado`

Registra el resultado oficial y liquida los tiquetes activos. Solo rol `ADMIN`.

**Headers**: `Authorization: Bearer <token_admin>`

**Body para CHANCE** (resultado de 4 dígitos)

```json
{
  "resultado": "1234"
}
```

**Body para BALOTO**

```json
{
  "resultado": {
    "numeros": [3, 10, 21, 30, 43],
    "superbalota": 7
  }
}
```

**Respuesta `200 OK`**: sorteo actualizado con `estado: "JUGADO"`, `resultado` y
`jugadoEn`.

```json
{
  "id": 1,
  "tipo": "CHANCE",
  "nombre": "Lotería de Bogotá",
  "fecha": "2026-11-13T19:00:00.000Z",
  "estado": "JUGADO",
  "resultado": "1234",
  "acumulado": 0,
  "jugadoEn": "2026-11-12T19:30:00.000Z"
}
```

**Errores**: `400` resultado inválido, `401`, `403`, `404` sorteo inexistente,
`409` sorteo ya jugado, `500`.

---

## 5. Tiquetes

### 5.1 `POST /api/v1/tickets/chance`

Vende un tiquete de chance. Solo rol `VENDEDOR`.

**Headers**: `Authorization: Bearer <token_vendedor>`

**Body**

```json
{
  "sorteoId": 1,
  "cliente": "Carlos Ruiz",
  "apuestas": [
    { "numero": "1234", "modalidad": "DIRECTO", "valor": 2000 },
    { "numero": "123", "modalidad": "COMBINADO", "valor": 600 }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `sorteoId` | number | Sí | Sorteo de tipo `CHANCE` abierto |
| `apuestas` | array | Sí | Entre 1 y 5 apuestas |
| `apuestas[].numero` | string | Sí | De 1 a 4 dígitos |
| `apuestas[].modalidad` | string | No | `DIRECTO` (default) o `COMBINADO` |
| `apuestas[].valor` | number | Sí | Entre `APUESTA_MIN_CHANCE` y `APUESTA_MAX_CHANCE`, múltiplo de 100 |
| `cliente` | string \| null | No | Nombre del cliente |

**Respuesta `201 Created`**

```json
{
  "id": 1,
  "codigo": "CH-3F9A2B7C",
  "tipo": "CHANCE",
  "sorteoId": 1,
  "vendedorId": 2,
  "cliente": "Carlos Ruiz",
  "apuestas": [
    { "numero": "1234", "cifras": 4, "modalidad": "DIRECTO", "valor": 2000 },
    { "numero": "123", "cifras": 3, "modalidad": "COMBINADO", "valor": 600 }
  ],
  "total": 2600,
  "estado": "ACTIVO",
  "premio": null,
  "creadoEn": "2026-11-12T19:05:00.000Z"
}
```

**Errores**

| Código | Causa |
| :--- | :--- |
| `400` | Sorteo de otro tipo, apuestas inválidas o cantidad fuera de 1–5 |
| `401` | Token ausente o inválido |
| `403` | Rol distinto de `VENDEDOR` |
| `404` | Sorteo inexistente |
| `409` | Sorteo no abierto o ventas cerradas |
| `500` | Error interno |

### 5.2 `POST /api/v1/tickets/baloto`

Vende un tiquete de Baloto. Solo rol `VENDEDOR`.

**Headers**: `Authorization: Bearer <token_vendedor>`

**Body**

```json
{
  "sorteoId": 3,
  "cliente": "María López",
  "jugadas": [
    { "numeros": [1, 2, 3, 4, 5], "superbalota": 6 },
    { "aleatoria": true }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `sorteoId` | number | Sí | Sorteo de tipo `BALOTO` abierto |
| `jugadas` | array | Sí | Entre 1 y 10 jugadas |
| `jugadas[].numeros` | number[] | Condicional | Exactamente 5 números únicos entre 1 y 43 |
| `jugadas[].superbalota` | number | Condicional | Entre 1 y 16 |
| `jugadas[].aleatoria` | boolean | Condicional | `true` genera la jugada automáticamente |
| `cliente` | string \| null | No | Nombre del cliente |

**Respuesta `201 Created`**

```json
{
  "id": 2,
  "codigo": "BL-A1B2C3D4",
  "tipo": "BALOTO",
  "sorteoId": 3,
  "vendedorId": 2,
  "cliente": "María López",
  "jugadas": [
    { "numeros": [1, 2, 3, 4, 5], "superbalota": 6 },
    { "numeros": [7, 12, 19, 28, 41], "superbalota": 9 }
  ],
  "total": 11400,
  "estado": "ACTIVO",
  "premio": null,
  "creadoEn": "2026-11-12T19:06:00.000Z"
}
```

El total se calcula como `número de jugadas × VALOR_BALOTO` (5700 por defecto).

**Errores**: mismos códigos que la venta de chance, con las reglas de Baloto.

### 5.3 `GET /api/v1/tickets`

Lista tiquetes. Un `ADMIN` ve todos; un `VENDEDOR` solo los propios.

**Query params (opcionales)**

| Parámetro | Ejemplo | Descripción |
| :--- | :--- | :--- |
| `fecha` | `2026-11-12` | Prefijo de fecha ISO de creación |
| `estado` | `ACTIVO`, `ANULADO`, `PAGADO`, `CADUCADO` | Estado del tiquete |

**Respuesta `200 OK`**: arreglo de tiquetes.

**Errores**: `401`, `500`.

### 5.4 `GET /api/v1/tickets/:codigo`

Consulta un tiquete por código e incluye el resumen del sorteo y si es ganador.

**Respuesta `200 OK`**

```json
{
  "id": 1,
  "codigo": "CH-3F9A2B7C",
  "tipo": "CHANCE",
  "sorteoId": 1,
  "vendedorId": 2,
  "cliente": "Carlos Ruiz",
  "apuestas": [
    { "numero": "1234", "cifras": 4, "modalidad": "DIRECTO", "valor": 2000, "premio": 9000000 }
  ],
  "total": 2000,
  "estado": "ACTIVO",
  "premio": 9000000,
  "creadoEn": "2026-11-12T19:05:00.000Z",
  "sorteo": {
    "id": 1,
    "nombre": "Lotería de Bogotá",
    "fecha": "2026-11-13T19:00:00.000Z",
    "estado": "JUGADO",
    "resultado": "1234"
  },
  "ganador": true
}
```

`ganador` es `null` si el sorteo aún no se ha jugado, `true` si el premio es mayor
que cero y `false` en caso contrario.

**Errores**: `401`, `404` tiquete inexistente, `500`.

### 5.5 `POST /api/v1/tickets/:codigo/anular`

Anula un tiquete. `ADMIN` puede anular cualquiera; `VENDEDOR` solo los propios y
dentro de `MINUTOS_ANULACION` (10 por defecto).

**Body**

```json
{
  "motivo": "Cliente cambió el número"
}
```

**Respuesta `200 OK`**

```json
{
  "id": 1,
  "codigo": "CH-3F9A2B7C",
  "tipo": "CHANCE",
  "estado": "ANULADO",
  "anulacion": {
    "usuarioId": 2,
    "motivo": "Cliente cambió el número",
    "fecha": "2026-11-12T19:10:00.000Z"
  }
}
```

**Errores**

| Código | Causa |
| :--- | :--- |
| `400` | Falta el motivo |
| `401` | Token ausente o inválido |
| `403` | Vendedor intenta anular un tiquete ajeno |
| `404` | Tiquete inexistente |
| `409` | Tiquete no activo, sorteo ya jugado o tiempo de anulación vencido |
| `500` | Error interno |

### 5.6 `POST /api/v1/tickets/:codigo/pagar`

Registra el pago de un premio. Solo rol `VENDEDOR`.

**Headers**: `Authorization: Bearer <token_vendedor>`

**Body**: no requiere cuerpo.

**Respuesta `200 OK`**

```json
{
  "id": 1,
  "ticketId": 1,
  "codigo": "CH-3F9A2B7C",
  "usuarioId": 2,
  "valor": 9000000,
  "fecha": "2026-11-12T20:00:00.000Z"
}
```

**Errores**

| Código | Causa |
| :--- | :--- |
| `401` | Token ausente o inválido |
| `403` | Rol distinto de `VENDEDOR` |
| `404` | Tiquete inexistente |
| `409` | Sorteo no jugado, premio ya pagado, tiquete no activo o sin premio |
| `410` | Premio caducado |
| `500` | Error interno |

---

## 6. Caja

### 6.1 `GET /api/v1/caja/resumen`

Devuelve el resumen de caja diario del vendedor autenticado. Un `ADMIN` puede
consultar a otro vendedor con `vendedorId`.

**Query params (opcionales)**

| Parámetro | Tipo | Descripción |
| :--- | :--- | :--- |
| `fecha` | `YYYY-MM-DD` | Fecha a consultar; por defecto la fecha local actual |
| `vendedorId` | number | Solo aplica a `ADMIN`; por defecto el usuario autenticado |

**Ejemplo**: `GET /api/v1/caja/resumen?fecha=2026-11-12&vendedorId=2`

**Respuesta `200 OK`**

```json
{
  "vendedorId": 2,
  "fecha": "2026-11-12",
  "tiquetesVendidos": 2,
  "tiquetesAnulados": 0,
  "ventasChance": 5000,
  "ventasBaloto": 5700,
  "totalVendido": 10700,
  "premiosPagados": 0,
  "totalPagado": 0,
  "saldoEsperado": 10700,
  "cerrada": false
}
```

**Errores**: `401`, `500`.

### 6.2 `POST /api/v1/caja/cierre`

Registra el cierre de caja diario. Solo rol `VENDEDOR`.

**Headers**: `Authorization: Bearer <token_vendedor>`

**Body**

```json
{
  "efectivoReportado": 10000,
  "fecha": "2026-11-12"
}
```

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `efectivoReportado` | integer | Sí | Efectivo contado, entero mayor o igual a 0 |
| `fecha` | `YYYY-MM-DD` | No | Fecha de cierre; por defecto la fecha local actual |

**Respuesta `201 Created`**

```json
{
  "id": 1,
  "vendedorId": 2,
  "fecha": "2026-11-12",
  "tiquetesVendidos": 2,
  "tiquetesAnulados": 0,
  "ventasChance": 5000,
  "ventasBaloto": 5700,
  "totalVendido": 10700,
  "premiosPagados": 0,
  "totalPagado": 0,
  "saldoEsperado": 10700,
  "cerrada": true,
  "efectivoReportado": 10000,
  "diferencia": -700,
  "estado": "FALTANTE",
  "creadoEn": "2026-11-12T21:00:00.000Z"
}
```

El campo `estado` puede ser `CUADRADA` (diferencia 0), `SOBRANTE` (diferencia
positiva) o `FALTANTE` (diferencia negativa).

**Errores**

| Código | Causa |
| :--- | :--- |
| `400` | Efectivo reportado inválido (no entero o negativo) |
| `401` | Token ausente o inválido |
| `403` | Rol distinto de `VENDEDOR` |
| `409` | La caja de esa fecha ya fue cerrada |
| `500` | Error interno |

---

## 7. Resumen de endpoints

| Verbo | Ruta | Rol | Controlador |
| :--- | :--- | :--- | :--- |
| GET | `/health` | Público | `src/app.js` |
| POST | `/api/v1/auth/login` | Público | `authController.login` |
| GET | `/api/v1/auth/perfil` | Autenticado | `authController.perfil` |
| GET | `/api/v1/sorteos` | Autenticado | `sorteoController.listar` |
| GET | `/api/v1/sorteos/:id` | Autenticado | `sorteoController.obtener` |
| POST | `/api/v1/sorteos` | ADMIN | `sorteoController.crear` |
| POST | `/api/v1/sorteos/:id/resultado` | ADMIN | `sorteoController.registrarResultado` |
| POST | `/api/v1/tickets/chance` | VENDEDOR | `ticketController.venderChance` |
| POST | `/api/v1/tickets/baloto` | VENDEDOR | `ticketController.venderBaloto` |
| GET | `/api/v1/tickets` | Autenticado | `ticketController.listar` |
| GET | `/api/v1/tickets/:codigo` | Autenticado | `ticketController.consultar` |
| POST | `/api/v1/tickets/:codigo/anular` | Autenticado | `ticketController.anular` |
| POST | `/api/v1/tickets/:codigo/pagar` | VENDEDOR | `ticketController.pagar` |
| GET | `/api/v1/caja/resumen` | Autenticado | `cajaController.resumen` |
| POST | `/api/v1/caja/cierre` | VENDEDOR | `cajaController.cerrar` |

> Para más detalle sobre reglas de negocio consulte [`../README.md`](../README.md) y [`MATRIZ_TRAZABILIDAD.md`](MATRIZ_TRAZABILIDAD.md).
