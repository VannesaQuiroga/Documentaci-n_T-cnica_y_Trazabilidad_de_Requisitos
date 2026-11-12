const request = require('supertest');
const app = require('../src/app');

async function tokenDe(usuario, password) {
  const res = await request(app).post('/api/v1/auth/login').send({ usuario, password });
  return res.body.token;
}

module.exports = {
  app,
  request,
  tokenAdmin: () => tokenDe('admin', 'admin123'),
  tokenVendedor: () => tokenDe('vendedor1', 'vende123'),
  tokenVendedor2: () => tokenDe('vendedor2', 'vende456'),
};
