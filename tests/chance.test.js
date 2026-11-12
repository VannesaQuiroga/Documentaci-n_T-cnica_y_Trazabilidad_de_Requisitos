const chance = require('../src/services/chanceService');

describe('Reglas de chance', () => {
  test('test_premio_directo_4_cifras', () => {
    const apuesta = chance.validarApuesta({ numero: '1234', valor: 1000 });
    expect(chance.calcularPremio(apuesta, '1234')).toBe(4500000);
    expect(chance.calcularPremio(apuesta, '4321')).toBe(0);
  });

  test('test_premio_directo_ultimas_cifras', () => {
    const tres = chance.validarApuesta({ numero: '234', valor: 1000 });
    const dos = chance.validarApuesta({ numero: '34', valor: 1000 });
    expect(chance.calcularPremio(tres, '1234')).toBe(400000);
    expect(chance.calcularPremio(dos, '1234')).toBe(50000);
  });

  test('test_premio_combinado_divide_por_permutaciones', () => {
    const apuesta = chance.validarApuesta({ numero: '123', modalidad: 'COMBINADO', valor: 600 });
    expect(chance.calcularPremio(apuesta, '9321')).toBe(40000);
  });

  test('test_validacion_apuesta_invalida', () => {
    expect(() => chance.validarApuesta({ numero: '12a4', valor: 1000 })).toThrow();
    expect(() => chance.validarApuesta({ numero: '1234', valor: 100 })).toThrow();
    expect(() => chance.validarApuesta({ numero: '12', modalidad: 'COMBINADO', valor: 1000 })).toThrow();
    expect(() => chance.validarApuesta({ numero: '1234', valor: 1050 })).toThrow();
  });
});
