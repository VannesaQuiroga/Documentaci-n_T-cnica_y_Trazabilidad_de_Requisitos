const { app, request } = require('./helpers');
const store = require('../src/data/store');

beforeEach(() => store.reset());

describe('Autenticación', () => {
  test('test_login_exitoso', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ usuario: 'vendedor1', password: 'vende123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.usuario.rol).toBe('VENDEDOR');
    expect(res.body.usuario.password).toBeUndefined();
  });

  test('test_login_credenciales_invalidas', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ usuario: 'vendedor1', password: 'mala' });
    expect(res.status).toBe(401);
  });

  test('test_ruta_protegida_sin_token', async () => {
    const res = await request(app).get('/api/v1/sorteos');
    expect(res.status).toBe(401);
  });
});
