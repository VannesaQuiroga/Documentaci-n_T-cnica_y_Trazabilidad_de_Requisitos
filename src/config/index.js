require('dotenv').config();

const entero = (valor, porDefecto) => {
  const n = parseInt(valor, 10);
  return Number.isNaN(n) ? porDefecto : n;
};

module.exports = {
  port: entero(process.env.PORT, 3000),
  jwtSecret: process.env.JWT_SECRET || 'cambiar-este-secreto',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  zonaHoraria: process.env.ZONA_HORARIA || 'America/Bogota',
  minutosAnulacion: entero(process.env.MINUTOS_ANULACION, 10),
  minutosCierreVentas: entero(process.env.MINUTOS_CIERRE_VENTAS, 15),
  apuestaMinChance: entero(process.env.APUESTA_MIN_CHANCE, 500),
  apuestaMaxChance: entero(process.env.APUESTA_MAX_CHANCE, 50000),
  valorBaloto: entero(process.env.VALOR_BALOTO, 5700),
  diasCaducidadPremio: entero(process.env.DIAS_CADUCIDAD_PREMIO, 365),
};
