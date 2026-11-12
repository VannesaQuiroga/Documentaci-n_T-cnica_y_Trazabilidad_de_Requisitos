const { app, request, tokenAdmin, tokenVendedor, tokenVendedor2 } = require('./helpers');
const store = require('../src/data/store');

let vendedor;
let admin;

beforeEach(async () => {
  store.reset();
  vendedor = await tokenVendedor();
  admin = await tokenAdmin();
});

const venderChance = (token, apuestas) => request(app)
  .post('/api/v1/tickets/chance')
  .set('Authorization', `Bearer ${token}`)
  .send({ sorteoId: 1, apuestas });

describe('Tiquetes', () => {
  test('test_venta_chance', async () => {
    const res = await venderChance(vendedor, [{ numero: '1234', valor: 2000 }, { numero: '56', valor: 1000 }]);
    expect(res.status).toBe(201);
    expect(res.body.codigo).toMatch(/^CH-/);
    expect(res.body.total).toBe(3000);
  });

  test('test_venta_baloto', async () => {
    const res = await request(app)
      .post('/api/v1/tickets/baloto')
      .set('Authorization', `Bearer ${vendedor}`)
      .send({ sorteoId: 3, jugadas: [{ numeros: [1, 2, 3, 4, 5], superbalota: 6 }, { aleatoria: true }] });
    expect(res.status).toBe(201);
    expect(res.body.total).toBe(11400);
  });

  test('test_venta_sorteo_cerrado', async () => {
    store.getDb().sorteos[0].fecha = new Date(Date.now() + 5 * 60000).toISOString();
    const res = await venderChance(vendedor, [{ numero: '1234', valor: 2000 }]);
    expect(res.status).toBe(409);
  });

  test('test_admin_no_vende', async () => {
    const res = await venderChance(admin, [{ numero: '1234', valor: 2000 }]);
    expect(res.status).toBe(403);
  });

  test('test_anulacion_ticket', async () => {
    const venta = await venderChance(vendedor, [{ numero: '1234', valor: 2000 }]);
    const otro = await tokenVendedor2();
    const ajeno = await request(app)
      .post(`/api/v1/tickets/${venta.body.codigo}/anular`)
      .set('Authorization', `Bearer ${otro}`)
      .send({ motivo: 'error' });
    expect(ajeno.status).toBe(403);

    const res = await request(app)
      .post(`/api/v1/tickets/${venta.body.codigo}/anular`)
      .set('Authorization', `Bearer ${vendedor}`)
      .send({ motivo: 'Cliente cambió el número' });
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('ANULADO');
  });

  test('test_anulacion_fuera_de_tiempo', async () => {
    const venta = await venderChance(vendedor, [{ numero: '1234', valor: 2000 }]);
    store.getDb().tickets[0].creadoEn = new Date(Date.now() - 60 * 60000).toISOString();
    const res = await request(app)
      .post(`/api/v1/tickets/${venta.body.codigo}/anular`)
      .set('Authorization', `Bearer ${vendedor}`)
      .send({ motivo: 'tarde' });
    expect(res.status).toBe(409);
  });

  test('test_resultado_y_pago_premio', async () => {
    const venta = await venderChance(vendedor, [{ numero: '1234', valor: 1000 }]);
    const resultado = await request(app)
      .post('/api/v1/sorteos/1/resultado')
      .set('Authorization', `Bearer ${admin}`)
      .send({ resultado: '1234' });
    expect(resultado.status).toBe(200);

    const consulta = await request(app)
      .get(`/api/v1/tickets/${venta.body.codigo}`)
      .set('Authorization', `Bearer ${vendedor}`);
    expect(consulta.body.ganador).toBe(true);
    expect(consulta.body.premio).toBe(4500000);

    const pago = await request(app)
      .post(`/api/v1/tickets/${venta.body.codigo}/pagar`)
      .set('Authorization', `Bearer ${vendedor}`);
    expect(pago.status).toBe(200);

    const doble = await request(app)
      .post(`/api/v1/tickets/${venta.body.codigo}/pagar`)
      .set('Authorization', `Bearer ${vendedor}`);
    expect(doble.status).toBe(409);
  });
});
