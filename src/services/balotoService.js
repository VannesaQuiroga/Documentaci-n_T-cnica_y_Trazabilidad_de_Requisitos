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

function generarAleatoria() {
  const numeros = new Set();
  while (numeros.size < 5) numeros.add(aleatorioEntre(1, MAX_NUMERO));
  return {
    numeros: [...numeros].sort((a, b) => a - b),
    superbalota: aleatorioEntre(1, MAX_SUPERBALOTA),
  };
}

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

function calcularPremio(jugada, resultado, acumulado = 0) {
  const aciertos = jugada.numeros.filter((n) => resultado.numeros.includes(n)).length;
  const sb = jugada.superbalota === resultado.superbalota ? 1 : 0;
  const premio = PREMIOS[`${aciertos}+${sb}`];
  if (!premio) return 0;
  return premio === 'ACUMULADO' ? acumulado : premio;
}

module.exports = { validarJugada, calcularPremio, generarAleatoria, PREMIOS };
