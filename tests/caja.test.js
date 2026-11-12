const { app, request, tokenAdmin, tokenVendedor } = require('./helpers');
const store = require('../src/data/store');

let vendedor;

beforeEach(async () => {
  store.reset();
  vendedor = await tokenVendedor();
});

describe('Caja', () => {
  test('test_resumen_caja_diario', async () => {
    await request(app).post('/api/v1/tickets/chance').set('Authorization', `Bearer ${vendedor}`)
      .send({ sorteoId: 1, apuestas: [{ numero: '1234', valor: 5000 }] });
    await request(app).post('/api/v1/tickets/baloto').set('Authorization', `Bearer ${vendedor}`)
      .send({ sorteoId: 3, jugadas: [{ aleatoria: true }] });

    const res = await request(app).get('/api/v1/caja/resumen').set('Authorization', `Bearer ${vendedor}`);
    expect(res.status).toBe(200);
    expect(res.body.tiquetesVendidos).toBe(2);
    expect(res.body.ventasChance).toBe(5000);
    expect(res.body.ventasBaloto).toBe(5700);
    expect(res.body.saldoEsperado).toBe(10700);
  });

  test('test_cierre_caja_con_faltante', async () => {
    await request(app).post('/api/v1/tickets/chance').set('Authorization', `Bearer ${vendedor}`)
      .send({ sorteoId: 1, apuestas: [{ numero: '1234', valor: 5000 }] });

    const res = await request(app).post('/api/v1/caja/cierre').set('Authorization', `Bearer ${vendedor}`)
      .send({ efectivoReportado: 4000 });
    expect(res.status).toBe(201);
    expect(res.body.estado).toBe('FALTANTE');
    expect(res.body.diferencia).toBe(-1000);

    const doble = await request(app).post('/api/v1/caja/cierre').set('Authorization', `Bearer ${vendedor}`)
      .send({ efectivoReportado: 5000 });
    expect(doble.status).toBe(409);
  });

  test('test_admin_crea_sorteo', async () => {
    const admin = await tokenAdmin();
    const res = await request(app).post('/api/v1/sorteos').set('Authorization', `Bearer ${admin}`)
      .send({ tipo: 'CHANCE', nombre: 'Lotería del Valle', fecha: new Date(Date.now() + 86400000).toISOString() });
    expect(res.status).toBe(201);
    expect(res.body.estado).toBe('ABIERTO');
  });
});
