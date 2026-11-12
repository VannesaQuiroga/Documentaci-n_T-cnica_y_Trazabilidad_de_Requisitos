const crypto = require('crypto');
const { getDb, nextId } = require('../data/store');
const AppError = require('../utils/AppError');
const chance = require('./chanceService');
const baloto = require('./balotoService');
const sorteos = require('./sorteoService');
const { valorBaloto, minutosAnulacion, diasCaducidadPremio } = require('../config');
const { minutosEntre, diasEntre } = require('../utils/fechas');

function generarCodigo(tipo) {
  const prefijo = tipo === 'CHANCE' ? 'CH' : 'BL';
  return `${prefijo}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function guardar(ticket) {
  getDb().tickets.push(ticket);
  return ticket;
}

/**
 * @function venderChance
 * @description Registra la venta de un tiquete de chance. Verifica que el sorteo
 * exista y admita ventas, valida entre 1 y 5 apuestas, calcula el total y genera un
 * codigo unico con prefijo `CH-`.
 * @param {{ id: number, rol: string }} vendedor - Usuario autenticado que realiza la venta.
 * @param {{ sorteoId: number|string, apuestas: Array<{ numero: string, modalidad?: 'DIRECTO'|'COMBINADO', valor: number }>, cliente?: string|null }} datos - Datos del tiquete recibidos en la peticion.
 * @returns {{ id: number, codigo: string, tipo: string, sorteoId: number, vendedorId: number, cliente: string|null, apuestas: Array<object>, total: number, estado: string, premio: null, creadoEn: string }} Tiquete creado en estado ACTIVO.
 * @throws {AppError} Codigo 404 si el sorteo no existe.
 * @throws {AppError} Codigo 400 si el sorteo no es de tipo CHANCE o las apuestas son invalidas.
 * @throws {AppError} Codigo 409 si el sorteo no esta abierto o las ventas ya cerraron.
 */
function venderChance(vendedor, { sorteoId, apuestas, cliente }) {
  const sorteo = sorteos.obtener(sorteoId);
  sorteos.verificarVentaPermitida(sorteo, 'CHANCE');

  if (!Array.isArray(apuestas) || apuestas.length === 0 || apuestas.length > 5) {
    throw new AppError('Un tiquete de chance debe tener entre 1 y 5 apuestas');
  }
  const validas = apuestas.map(chance.validarApuesta);

  return guardar({
    id: nextId('tickets'),
    codigo: generarCodigo('CHANCE'),
    tipo: 'CHANCE',
    sorteoId: sorteo.id,
    vendedorId: vendedor.id,
    cliente: cliente || null,
    apuestas: validas,
    total: validas.reduce((s, a) => s + a.valor, 0),
    estado: 'ACTIVO',
    premio: null,
    creadoEn: new Date().toISOString(),
  });
}

/**
 * @function venderBaloto
 * @description Registra la venta de un tiquete de Baloto. Verifica que el sorteo
 * exista y admita ventas, valida entre 1 y 10 jugadas (manuales o aleatorias),
 * calcula el total segun `VALOR_BALOTO` y genera un codigo unico con prefijo `BL-`.
 * @param {{ id: number, rol: string }} vendedor - Usuario autenticado que realiza la venta.
 * @param {{ sorteoId: number|string, jugadas: Array<{ aleatoria?: boolean, numeros?: number[], superbalota?: number }>, cliente?: string|null }} datos - Datos del tiquete recibidos en la peticion.
 * @returns {{ id: number, codigo: string, tipo: string, sorteoId: number, vendedorId: number, cliente: string|null, jugadas: Array<object>, total: number, estado: string, premio: null, creadoEn: string }} Tiquete creado en estado ACTIVO.
 * @throws {AppError} Codigo 404 si el sorteo no existe.
 * @throws {AppError} Codigo 400 si el sorteo no es de tipo BALOTO o las jugadas son invalidas.
 * @throws {AppError} Codigo 409 si el sorteo no esta abierto o las ventas ya cerraron.
 */
function venderBaloto(vendedor, { sorteoId, jugadas, cliente }) {
  const sorteo = sorteos.obtener(sorteoId);
  sorteos.verificarVentaPermitida(sorteo, 'BALOTO');

  if (!Array.isArray(jugadas) || jugadas.length === 0 || jugadas.length > 10) {
    throw new AppError('Un tiquete de Baloto debe tener entre 1 y 10 jugadas');
  }
  const validas = jugadas.map(baloto.validarJugada);

  return guardar({
    id: nextId('tickets'),
    codigo: generarCodigo('BALOTO'),
    tipo: 'BALOTO',
    sorteoId: sorteo.id,
    vendedorId: vendedor.id,
    cliente: cliente || null,
    jugadas: validas,
    total: validas.length * valorBaloto,
    estado: 'ACTIVO',
    premio: null,
    creadoEn: new Date().toISOString(),
  });
}

function buscar(codigo) {
  const ticket = getDb().tickets.find((t) => t.codigo === codigo);
  if (!ticket) throw new AppError('Tiquete no encontrado', 404);
  return ticket;
}

/**
 * @function listar
 * @description Lista los tiquetes visibles para el usuario autenticado. Un ADMIN
 * puede ver todos los tiquetes; un VENDEDOR solo los propios. Permite filtrar por
 * estado y por fecha (prefijo ISO `YYYY-MM-DD` sobre la fecha de creacion).
 * @param {{ id: number, rol: string }} usuario - Usuario autenticado.
 * @param {{ fecha?: string, estado?: string }} [filtros] - Filtros opcionales de la consulta.
 * @returns {Array<object>} Tiquetes que cumplen los filtros.
 */
function listar(usuario, { fecha, estado } = {}) {
  return getDb().tickets.filter((t) =>
    (usuario.rol === 'ADMIN' || t.vendedorId === usuario.id) &&
    (!estado || t.estado === estado) &&
    (!fecha || t.creadoEn.startsWith(fecha)));
}

/**
 * @function consultar
 * @description Recupera un tiquete por su codigo e incluye un resumen del sorteo
 * asociado. Si el sorteo ya fue jugado, indica si el tiquete resulto ganador.
 * @param {string} codigo - Codigo unico del tiquete (por ejemplo, `CH-A1B2C3D4`).
 * @returns {object} Tiquete con las propiedades `sorteo` y `ganador` agregadas.
 * @throws {AppError} Codigo 404 si el tiquete no existe.
 */
function consultar(codigo) {
  const ticket = buscar(codigo);
  const sorteo = sorteos.obtener(ticket.sorteoId);
  return {
    ...ticket,
    sorteo: { id: sorteo.id, nombre: sorteo.nombre, fecha: sorteo.fecha, estado: sorteo.estado, resultado: sorteo.resultado },
    ganador: sorteo.estado === 'JUGADO' ? ticket.premio > 0 : null,
  };
}

/**
 * @function anular
 * @description Anula un tiquete ACTIVO aplicando las politicas del negocio: un
 * VENDEDOR solo puede anular tiquetes propios dentro de los `MINUTOS_ANULACION`
 * minutos posteriores a la venta, mientras que un ADMIN puede anular cualquier
 * tiquete. No se permite anular tiquetes de sorteos ya jugados y el motivo es
 * obligatorio.
 * @param {string} codigo - Codigo unico del tiquete.
 * @param {{ id: number, rol: string }} usuario - Usuario que solicita la anulacion.
 * @param {string} motivo - Motivo de la anulacion.
 * @returns {object} Tiquete actualizado en estado ANULADO con los datos de la anulacion.
 * @throws {AppError} Codigo 404 si el tiquete no existe.
 * @throws {AppError} Codigo 403 si el vendedor intenta anular un tiquete ajeno.
 * @throws {AppError} Codigo 400 si no se indica el motivo.
 * @throws {AppError} Codigo 409 si el tiquete no esta ACTIVO, el sorteo ya fue jugado o se supero el tiempo permitido.
 */
function anular(codigo, usuario, motivo) {
  const ticket = buscar(codigo);

  if (usuario.rol !== 'ADMIN' && ticket.vendedorId !== usuario.id) {
    throw new AppError('No puede anular tiquetes de otro vendedor', 403);
  }
  if (ticket.estado !== 'ACTIVO') throw new AppError(`El tiquete está ${ticket.estado}`, 409);
  if (sorteos.obtener(ticket.sorteoId).estado === 'JUGADO') {
    throw new AppError('No se puede anular un tiquete de un sorteo jugado', 409);
  }
  if (usuario.rol !== 'ADMIN' && minutosEntre(ticket.creadoEn) > minutosAnulacion) {
    throw new AppError(`Solo se puede anular dentro de los ${minutosAnulacion} minutos siguientes a la venta`, 409);
  }
  if (!motivo) throw new AppError('Debe indicar el motivo de anulación');

  ticket.estado = 'ANULADO';
  ticket.anulacion = { usuarioId: usuario.id, motivo, fecha: new Date().toISOString() };
  return ticket;
}

/**
 * @function pagarPremio
 * @description Registra el pago del premio de un tiquete ganador. Exige que el
 * sorteo este JUGADO, que el tiquete siga ACTIVO, que tenga premio y que no haya
 * superado los `DIAS_CADUCIDAD_PREMIO` dias desde la fecha de juego. El pago se
 * registra una sola vez y el tiquete pasa a estado PAGADO.
 * @param {string} codigo - Codigo unico del tiquete.
 * @param {{ id: number, rol: string }} usuario - Vendedor que registra el pago.
 * @returns {{ id: number, ticketId: number, codigo: string, usuarioId: number, valor: number, fecha: string }} Pago registrado.
 * @throws {AppError} Codigo 404 si el tiquete no existe.
 * @throws {AppError} Codigo 409 si el sorteo no se ha jugado, el premio ya fue pagado, el tiquete no esta ACTIVO o no tiene premio.
 * @throws {AppError} Codigo 410 si el premio esta caducado.
 */
function pagarPremio(codigo, usuario) {
  const ticket = buscar(codigo);
  const sorteo = sorteos.obtener(ticket.sorteoId);

  if (sorteo.estado !== 'JUGADO') throw new AppError('El sorteo aún no se ha jugado', 409);
  if (ticket.estado === 'PAGADO') throw new AppError('El premio ya fue pagado', 409);
  if (ticket.estado !== 'ACTIVO') throw new AppError(`El tiquete está ${ticket.estado}`, 409);
  if (!ticket.premio) throw new AppError('El tiquete no tiene premio', 409);
  if (diasEntre(sorteo.jugadoEn) > diasCaducidadPremio) {
    ticket.estado = 'CADUCADO';
    throw new AppError('El premio está caducado', 410);
  }

  const pago = {
    id: nextId('pagos'),
    ticketId: ticket.id,
    codigo: ticket.codigo,
    usuarioId: usuario.id,
    valor: ticket.premio,
    fecha: new Date().toISOString(),
  };
  getDb().pagos.push(pago);
  ticket.estado = 'PAGADO';
  return pago;
}

module.exports = { venderChance, venderBaloto, consultar, listar, anular, pagarPremio };
