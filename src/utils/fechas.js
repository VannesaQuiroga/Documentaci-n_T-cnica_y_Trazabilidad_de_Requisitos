const { zonaHoraria } = require('../config');

/**
 * @function fechaLocal
 * @description Convierte una fecha a su representacion `YYYY-MM-DD` en la zona
 * horaria configurada (`ZONA_HORARIA`), usada para agrupar ventas y cierres por dia.
 * @param {Date|string} [fecha=new Date()] - Fecha a convertir.
 * @returns {string} Fecha local en formato `YYYY-MM-DD`.
 */
const fechaLocal = (fecha = new Date()) =>
  new Date(fecha).toLocaleDateString('en-CA', { timeZone: zonaHoraria });

/**
 * @function minutosEntre
 * @description Calcula la diferencia en minutos entre dos fechas.
 * @param {Date|string} desde - Fecha inicial.
 * @param {Date|string} [hasta=new Date()] - Fecha final; por defecto el momento actual.
 * @returns {number} Diferencia en minutos (`hasta - desde`).
 */
const minutosEntre = (desde, hasta = new Date()) =>
  (new Date(hasta).getTime() - new Date(desde).getTime()) / 60000;

/**
 * @function diasEntre
 * @description Calcula la diferencia en dias entre dos fechas.
 * @param {Date|string} desde - Fecha inicial.
 * @param {Date|string} [hasta=new Date()] - Fecha final; por defecto el momento actual.
 * @returns {number} Diferencia en dias (`hasta - desde`).
 */
const diasEntre = (desde, hasta = new Date()) => minutosEntre(desde, hasta) / 1440;

module.exports = { fechaLocal, minutosEntre, diasEntre };
