const AppError = require('../utils/AppError');

function noEncontrado(req, res, next) {
  next(new AppError(`Ruta ${req.method} ${req.originalUrl} no existe`, 404));
}

/**
 * @function manejarErrores
 * @description Middleware centralizado de errores. Traduce fallos de parseo de JSON
 * a 400, respeta el codigo HTTP de las instancias de `AppError` y oculta los detalles
 * de errores inesperados devolviendo 500 con un mensaje generico.
 * @param {Error & { status?: number, type?: string }} err - Error capturado por Express.
 * @param {import('express').Request} req - Peticion HTTP que origino el error.
 * @param {import('express').Response} res - Respuesta HTTP donde se escribe el error.
 * @param {import('express').NextFunction} next - Siguiente middleware (no utilizado, requerido por Express).
 * @returns {void}
 */
function manejarErrores(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON mal formado' });
  }
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Error interno del servidor' : err.message });
}

module.exports = { noEncontrado, manejarErrores };
