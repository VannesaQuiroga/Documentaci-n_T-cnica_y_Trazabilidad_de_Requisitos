const AppError = require('../utils/AppError');

const MAX_NUMERO = 43;
const MAX_SUPERBALOTA = 16;

const PREMIOS = {
  '5+1': 'ACUMULADO',
  '5+0': 50000000,
  '4+1': 2000000,
  '4+0': 150000,
  '3+1': 40000,
  '3+0': 12000,
  '2+1': 9000,
  '1+1': 5700,
  '0+1': 5700,
};

function aleatorioEntre(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * @function generarAleatoria
 * @description Genera una jugada aleatoria de Baloto: 5 numeros unicos entre 1 y 43,
 * ordenados de menor a mayor, y una superbalota entre 1 y 16.
 * @returns {{ numeros: number[], superbalota: number }} Jugada generada lista para ser vendida.
 */
function generarAleatoria() {
  const numeros = new Set();
  while (numeros.size < 5) numeros.add(aleatorioEntre(1, MAX_NUMERO));
  return {
    numeros: [...numeros].sort((a, b) => a - b),
    superbalota: aleatorioEntre(1, MAX_SUPERBALOTA),
  };
}

/**
 * @function validarJugada
 * @description Valida y normaliza una jugada de Baloto. Si la jugada solicita el
 * modo aleatorio (`aleatoria: true`) genera los numeros automaticamente; de lo
 * contrario, exige exactamente 5 numeros enteros unicos entre 1 y 43 y una
 * superbalota entre 1 y 16. Los numeros se retornan ordenados.
 * @param {{ aleatoria?: boolean, numeros?: number[], superbalota?: number }} [jugada] - Jugada recibida en el cuerpo de la peticion.
 * @returns {{ numeros: number[], superbalota: number }} Jugada validada con numeros ordenados ascendentemente.
 * @throws {AppError} Codigo 400 si la jugada no tiene 5 numeros, hay repetidos, alguno esta fuera de rango o la superbalota es invalida.
 */
function validarJugada(jugada) {
  if (jugada && jugada.aleatoria === true) return generarAleatoria();

  const { numeros, superbalota } = jugada || {};
  if (!Array.isArray(numeros) || numeros.length !== 5) {
    throw new AppError('Cada jugada debe tener exactamente 5 números');
  }
  if (!numeros.every((n) => Number.isInteger(n) && n >= 1 && n <= MAX_NUMERO)) {
    throw new AppError(`Los números deben estar entre 1 y ${MAX_NUMERO}`);
  }
  if (new Set(numeros).size !== 5) {
    throw new AppError('Los números de una jugada no se pueden repetir');
  }
  if (!Number.isInteger(superbalota) || superbalota < 1 || superbalota > MAX_SUPERBALOTA) {
    throw new AppError(`La superbalota debe estar entre 1 y ${MAX_SUPERBALOTA}`);
  }
  return { numeros: [...numeros].sort((a, b) => a - b), superbalota };
}

/**
 * @function calcularPremio
 * @description Calcula el premio de una jugada de Baloto contando los aciertos de
 * numeros y la superbalota, y consultando la tabla de premios. El acierto 5+1
 * otorga el acumulado del sorteo.
 * @param {{ numeros: number[], superbalota: number }} jugada - Jugada validada del tiquete.
 * @param {{ numeros: number[], superbalota: number }} resultado - Resultado oficial del sorteo.
 * @param {number} [acumulado=0] - Valor acumulado vigente para el premio mayor.
 * @returns {number} Valor del premio en pesos colombianos; `0` si la jugada no gana.
 */
function calcularPremio(jugada, resultado, acumulado = 0) {
  const aciertos = jugada.numeros.filter((n) => resultado.numeros.includes(n)).length;
  const sb = jugada.superbalota === resultado.superbalota ? 1 : 0;
  const premio = PREMIOS[`${aciertos}+${sb}`];
  if (!premio) return 0;
  return premio === 'ACUMULADO' ? acumulado : premio;
}

module.exports = { validarJugada, calcularPremio, generarAleatoria, PREMIOS };
