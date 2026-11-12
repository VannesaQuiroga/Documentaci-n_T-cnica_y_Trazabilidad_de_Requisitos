const bcrypt = require('bcryptjs');

let db;

const enHoras = (h) => new Date(Date.now() + h * 3600 * 1000).toISOString();

function seed() {
  db = {
    usuarios: [
      { id: 1, usuario: 'admin', nombre: 'Administrador', rol: 'ADMIN', password: bcrypt.hashSync('admin123', 8), activo: true },
      { id: 2, usuario: 'vendedor1', nombre: 'Ana Pérez', rol: 'VENDEDOR', password: bcrypt.hashSync('vende123', 8), activo: true },
      { id: 3, usuario: 'vendedor2', nombre: 'Luis Gómez', rol: 'VENDEDOR', password: bcrypt.hashSync('vende456', 8), activo: true },
    ],
    sorteos: [
      { id: 1, tipo: 'CHANCE', nombre: 'Lotería de Bogotá', fecha: enHoras(24), estado: 'ABIERTO', resultado: null, acumulado: 0 },
      { id: 2, tipo: 'CHANCE', nombre: 'Lotería de Medellín', fecha: enHoras(30), estado: 'ABIERTO', resultado: null, acumulado: 0 },
      { id: 3, tipo: 'BALOTO', nombre: 'Baloto', fecha: enHoras(48), estado: 'ABIERTO', resultado: null, acumulado: 4500000000 },
    ],
    tickets: [],
    pagos: [],
    cierres: [],
    seq: { sorteos: 4, tickets: 1, pagos: 1, cierres: 1 },
  };
}

seed();

module.exports = {
  getDb: () => db,
  nextId: (tabla) => db.seq[tabla]++,
  reset: seed,
};
