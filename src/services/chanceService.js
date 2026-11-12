const AppError = require('../utils/AppError');
const { apuestaMinChance, apuestaMaxChance } = require('../config');

const TABLA_PAGOS = { 4: 4500, 3: 400, 2: 50, 1: 5 };
const MODALIDADES = ['DIRECTO', 'COMBINADO'];

function permutaciones(numero) {
  if (numero.length <= 1) return new Set([numero]);
  const resultado = new Set();
  [...numero].forEach((digito, i) => {
    const resto = numero.slice(0, i) + numero.slice(i + 1);
    permutaciones(resto).forEach((p) => resultado.add(digito + p));
  });
  return resultado;
}

/**
 * @function validarApuesta
 * @description Valida y normaliza una apuesta de chance. Verifica el formato del
 * numero (1 a 4 digitos), la modalidad (DIRECTO o COMBINADO), las restricciones de
 * la modalidad combinada y el rango del valor apostado, incluyendo que sea multiplo
 * de 100. Retorna la apuesta con las cifras calculadas.
 * @param {{ numero?: string, modalidad?: 'DIRECTO'|'COMBINADO', valor?: number }} apuesta - Apuesta recibida en el cuerpo de la peticion.
 * @returns {{ numero: string, cifras: number, modalidad: 'DIRECTO'|'COMBINADO', valor: number }} Apuesta validada y normalizada.
 * @throws {AppError} Codigo 400 si el numero no tiene entre 1 y 4 digitos, la modalidad es invalida,
 * el valor esta fuera del rango permitido o no es multiplo de 100.
 */
function validarApuesta(apuesta) {
  const { numero, modalidad = 'DIRECTO', valor } = apuesta || {};

  if (typeof numero !== 'string' || !/^\d{1,4}$/.test(numero)) {
    throw new AppError('El número debe tener entre 1 y 4 dígitos');
  }
  if (!MODALIDADES.includes(modalidad)) {
    throw new AppError(`Modalidad inválida: ${modalidad}`);
  }
  if (modalidad === 'COMBINADO' && numero.length < 3) {
    throw new AppError('La modalidad COMBINADO solo aplica para 3 o 4 cifras');
  }
  if (modalidad === 'COMBINADO' && permutaciones(numero).size === 1) {
    throw new AppError('Un número con todas las cifras iguales no se puede combinar');
  }
  if (!Number.isInteger(valor) || valor < apuestaMinChance || valor > apuestaMaxChance) {
    throw new AppError(`El valor debe estar entre ${apuestaMinChance} y ${apuestaMaxChance}`);
  }
  if (valor % 100 !== 0) {
    throw new AppError('El valor debe ser múltiplo de 100');
  }

  return { numero, cifras: numero.length, modalidad, valor };
}

/**
 * @function calcularPremio
 * @description Calcula el premio de una apuesta de chance comparando el numero
 * apostado con las ultimas cifras del resultado oficial. En modalidad DIRECTO el
 * premio se multiplica por la tabla de pagos; en modalidad COMBINADO se consideran
 * todas las permutaciones del numero y el premio se divide entre ellas.
 * @param {{ numero: string, cifras: number, modalidad: 'DIRECTO'|'COMBINADO', valor: number }} apuesta - Apuesta previamente validada.
 * @param {string} resultado - Resultado oficial del sorteo, cadena de exactamente 4 digitos.
 * @returns {number} Valor del premio en pesos colombianos; `0` si no hay acierto.
 */
function calcularPremio(apuesta, resultado) {
  const ganador = resultado.slice(-apuesta.cifras);
  const factor = TABLA_PAGOS[apuesta.cifras];

  if (apuesta.modalidad === 'DIRECTO') {
    return apuesta.numero === ganador ? apuesta.valor * factor : 0;
  }

  const combinaciones = permutaciones(apuesta.numero);
  if (!combinaciones.has(ganador)) return 0;
  return Math.floor((apuesta.valor * factor) / combinaciones.size);
}

/**
 * @function validarResultado
 * @description Valida que el resultado oficial de un sorteo de chance sea una
 * cadena de exactamente 4 digitos.
 * @param {string} resultado - Resultado ingresado por el administrador.
 * @returns {string} El mismo resultado validado.
 * @throws {AppError} Codigo 400 si el resultado no es una cadena de 4 digitos.
 */
function validarResultado(resultado) {
  if (typeof resultado !== 'string' || !/^\d{4}$/.test(resultado)) {
    throw new AppError('El resultado de chance debe ser un número de 4 dígitos');
  }
  return resultado;
}

module.exports = { validarApuesta, calcularPremio, validarResultado, permutaciones, TABLA_PAGOS };
