# Matriz de Trazabilidad de Requisitos (RTM)

| Campo | Valor |
| :--- | :--- |
| **Proyecto** | Puesto de Chance API |
| **Versión** | 1.0.0 |
| **Estándar de referencia** | Análisis y Desarrollo de Software (ADSO) |
| **Fecha de auditoría** | 2026-11-12 |
| **Responsable de QA** | Equipo de Calidad / Arquitectura |
| **Alcance** | Requerimientos funcionales implementados en `src/` y su evidencia de prueba en `tests/` |

---

## 1. Convenciones

| Estado QA | Significado |
| :--- | :--- |
| **Aprobado** | Requerimiento implementado y cubierto por al menos una prueba automatizada exitosa. |
| **Parcial** | Requerimiento implementado; la cobertura automatizada cubre solo una parte del flujo. |
| **Pendiente** | Requerimiento implementado sin prueba automatizada dedicada, o brecha identificada. |

Evidencia de ejecución: `npm test` → **5 suites, 20 pruebas, 20 aprobadas** (Jest 29.7.0 + Supertest 7.0.0).

---

## 2. Requerimientos Funcionales (RF)

| ID RF | Requerimiento Funcional | HU Asociada |
| :--- | :--- | :--- |
| RF-001 | Autenticación de usuarios con credenciales y emisión de token JWT | HU-001 |
| RF-002 | Autorización de acciones según rol (`ADMIN` / `VENDEDOR`) | HU-002 |
| RF-003 | Consulta del perfil del usuario autenticado | HU-003 |
| RF-004 | Gestión de sorteos: listar, consultar detalle y crear | HU-004 |
| RF-005 | Registro de resultados y liquidación automática de premios | HU-005 |
| RF-006 | Validación de reglas de apuestas de chance y jugadas de Baloto | HU-006 |
| RF-007 | Venta de tiquetes de chance | HU-007 |
| RF-008 | Venta de tiquetes de Baloto | HU-008 |
| RF-009 | Consulta y listado de tiquetes con filtros | HU-009 |
| RF-010 | Anulación de tiquetes con reglas de tiempo y propiedad | HU-010 |
| RF-011 | Pago único de premios con control de caducidad | HU-011 |
| RF-012 | Resumen y cierre diario de caja | HU-012 |
| RF-013 | Monitoreo básico del servicio mediante endpoint de salud | HU-013 |
| RF-014 | Manejo centralizado y uniforme de errores HTTP | HU-014 |

---

## 3. Historias de Usuario y Matriz de Trazabilidad

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

---

## 4. Evidencia de Pruebas Automatizadas

| Archivo de prueba | Casos | Cobertura funcional |
| :--- | :--- | :--- |
| `tests/auth.test.js` | `test_login_exitoso`, `test_login_credenciales_invalidas`, `test_ruta_protegida_sin_token` | Autenticación JWT y protección de rutas |
| `tests/chance.test.js` | `test_premio_directo_4_cifras`, `test_premio_directo_ultimas_cifras`, `test_premio_combinado_divide_por_permutaciones`, `test_validacion_apuesta_invalida` | Reglas y premios de chance |
| `tests/baloto.test.js` | `test_jugada_aleatoria_valida`, `test_jugada_numeros_repetidos`, `test_premio_por_aciertos` | Reglas y premios de Baloto |
| `tests/tickets.test.js` | `test_venta_chance`, `test_venta_baloto`, `test_venta_sorteo_cerrado`, `test_admin_no_vende`, `test_anulacion_ticket`, `test_anulacion_fuera_de_tiempo`, `test_resultado_y_pago_premio` | Ciclo de vida del tiquete |
| `tests/caja.test.js` | `test_resumen_caja_diario`, `test_cierre_caja_con_faltante`, `test_admin_crea_sorteo` | Caja, cierre y creación de sorteos |

---

## 5. Brechas y Acciones de Mejora (Plan de QA)

| ID | Brecha identificada | Impacto | Acción sugerida |
| :--- | :--- | :--- | :--- |
| GAP-01 | Sin prueba automatizada para `GET /api/v1/auth/perfil` | Bajo | Agregar caso en `tests/auth.test.js` |
| GAP-02 | Sin prueba para listado de tiquetes con filtros | Medio | Agregar `test_listar_tickets_filtros()` |
| GAP-03 | Caducidad de premio (`410`) sin prueba automatizada | Medio | Simular `sorteo.jugadoEn` antiguo y verificar `410` |
| GAP-04 | Sin prueba del endpoint `/health` ni del formato de errores globales | Bajo | Agregar pruebas de humo y de JSON mal formado |
| GAP-05 | Persistencia solo en memoria: los datos se pierden al reiniciar | Alto (producción) | Integrar base de datos persistente (por ejemplo, PostgreSQL) |
| GAP-06 | No existe definición OpenAPI/Swagger automatizada | Medio | Adoptar `swagger-ui-express` + esquema OpenAPI 3.0 |
| GAP-07 | Credenciales de demostración embebidas en el código (`store.js`) | Alto (producción) | Mover usuarios semilla a variables de entorno o base de datos |
