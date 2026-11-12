const AppError = require('../utils/AppError');

function noEncontrado(req, res, next) {
  next(new AppError(`Ruta ${req.method} ${req.originalUrl} no existe`, 404));
}

function manejarErrores(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON mal formado' });
  }
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Error interno del servidor' : err.message });
}

module.exports = { noEncontrado, manejarErrores };
