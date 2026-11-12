const baloto = require('../src/services/balotoService');

describe('Reglas de Baloto', () => {
  test('test_jugada_aleatoria_valida', () => {
    const j = baloto.validarJugada({ aleatoria: true });
    expect(j.numeros).toHaveLength(5);
    expect(new Set(j.numeros).size).toBe(5);
    expect(j.superbalota).toBeGreaterThanOrEqual(1);
    expect(j.superbalota).toBeLessThanOrEqual(16);
  });

  test('test_jugada_numeros_repetidos', () => {
    expect(() => baloto.validarJugada({ numeros: [1, 1, 2, 3, 4], superbalota: 5 })).toThrow();
    expect(() => baloto.validarJugada({ numeros: [1, 2, 3, 4, 44], superbalota: 5 })).toThrow();
  });

  test('test_premio_por_aciertos', () => {
    const resultado = { numeros: [3, 10, 21, 30, 43], superbalota: 7 };
    expect(baloto.calcularPremio({ numeros: [3, 10, 21, 30, 43], superbalota: 7 }, resultado, 1000)).toBe(1000);
    expect(baloto.calcularPremio({ numeros: [3, 10, 21, 30, 1], superbalota: 7 }, resultado)).toBe(2000000);
    expect(baloto.calcularPremio({ numeros: [1, 2, 4, 5, 6], superbalota: 2 }, resultado)).toBe(0);
  });
});
