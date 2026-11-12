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

function listar(usuario, { fecha, estado } = {}) {
  return getDb().tickets.filter((t) =>
    (usuario.rol === 'ADMIN' || t.vendedorId === usuario.id) &&
    (!estado || t.estado === estado) &&
    (!fecha || t.creadoEn.startsWith(fecha)));
}

function consultar(codigo) {
  const ticket = buscar(codigo);
  const sorteo = sorteos.obtener(ticket.sorteoId);
  return {
    ...ticket,
    sorteo: { id: sorteo.id, nombre: sorteo.nombre, fecha: sorteo.fecha, estado: sorteo.estado, resultado: sorteo.resultado },
    ganador: sorteo.estado === 'JUGADO' ? ticket.premio > 0 : null,
  };
}

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
