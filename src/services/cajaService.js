const { getDb, nextId } = require('../data/store');
const AppError = require('../utils/AppError');
const { fechaLocal } = require('../utils/fechas');

/**
 * @function resumen
 * @description Calcula el resumen de caja de un vendedor para una fecha local
 * (zona horaria `ZONA_HORARIA`): tiquetes vendidos y anulados, ventas por producto,
 * premios pagados, saldo esperado y si la caja ya fue cerrada.
 * @param {number} vendedorId - Identificador del vendedor.
 * @param {string} [fecha=fechaLocal()] - Fecha en formato `YYYY-MM-DD`; por defecto la fecha local actual.
 * @returns {{ vendedorId: number, fecha: string, tiquetesVendidos: number, tiquetesAnulados: number, ventasChance: number, ventasBaloto: number, totalVendido: number, premiosPagados: number, totalPagado: number, saldoEsperado: number, cerrada: boolean }} Resumen diario de caja.
 */
function resumen(vendedorId, fecha = fechaLocal()) {
  const db = getDb();
  const delDia = (iso) => fechaLocal(iso) === fecha;

  const tickets = db.tickets.filter((t) => t.vendedorId === vendedorId && delDia(t.creadoEn));
  const validos = tickets.filter((t) => t.estado !== 'ANULADO');
  const pagos = db.pagos.filter((p) => p.usuarioId === vendedorId && delDia(p.fecha));

  const totalVendido = validos.reduce((s, t) => s + t.total, 0);
  const totalPagado = pagos.reduce((s, p) => s + p.valor, 0);

  return {
    vendedorId,
    fecha,
    tiquetesVendidos: validos.length,
    tiquetesAnulados: tickets.length - validos.length,
    ventasChance: validos.filter((t) => t.tipo === 'CHANCE').reduce((s, t) => s + t.total, 0),
    ventasBaloto: validos.filter((t) => t.tipo === 'BALOTO').reduce((s, t) => s + t.total, 0),
    totalVendido,
    premiosPagados: pagos.length,
    totalPagado,
    saldoEsperado: totalVendido - totalPagado,
    cerrada: db.cierres.some((c) => c.vendedorId === vendedorId && c.fecha === fecha),
  };
}

/**
 * @function cerrar
 * @description Realiza el cierre de caja diario de un vendedor. Compara el efectivo
 * reportado contra el saldo esperado, calcula la diferencia y clasifica el cierre
 * como CUADRADA, SOBRANTE o FALTANTE. Solo se permite un cierre por vendedor y fecha.
 * @param {number} vendedorId - Identificador del vendedor.
 * @param {{ efectivoReportado: number, fecha?: string }} datos - Efectivo contado y fecha opcional de cierre.
 * @returns {{ id: number, vendedorId: number, fecha: string, tiquetesVendidos: number, tiquetesAnulados: number, ventasChance: number, ventasBaloto: number, totalVendido: number, premiosPagados: number, totalPagado: number, saldoEsperado: number, cerrada: boolean, efectivoReportado: number, diferencia: number, estado: 'CUADRADA'|'SOBRANTE'|'FALTANTE', creadoEn: string }} Cierre de caja registrado.
 * @throws {AppError} Codigo 400 si el efectivo reportado no es un entero positivo.
 * @throws {AppError} Codigo 409 si la caja de esa fecha ya fue cerrada.
 */
function cerrar(vendedorId, { efectivoReportado, fecha = fechaLocal() }) {
  if (!Number.isInteger(efectivoReportado) || efectivoReportado < 0) {
    throw new AppError('El efectivo reportado debe ser un entero positivo');
  }
  const r = resumen(vendedorId, fecha);
  if (r.cerrada) throw new AppError('La caja de ese día ya fue cerrada', 409);

  const diferencia = efectivoReportado - r.saldoEsperado;
  const cierre = {
    id: nextId('cierres'),
    ...r,
    cerrada: true,
    efectivoReportado,
    diferencia,
    estado: diferencia === 0 ? 'CUADRADA' : diferencia > 0 ? 'SOBRANTE' : 'FALTANTE',
    creadoEn: new Date().toISOString(),
  };
  getDb().cierres.push(cierre);
  return cierre;
}

module.exports = { resumen, cerrar };
