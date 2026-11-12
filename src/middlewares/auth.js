const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const { buscarPorId } = require('../services/authService');
const AppError = require('../utils/AppError');

/**
 * @function autenticar
 * @description Middleware de autenticacion que extrae el token Bearer del encabezado
 * `Authorization`, verifica su firma y vigencia, y carga en `req.usuario` al usuario
 * activo asociado al token. Si el token falta, es invalido, expiro o el usuario ya
 * no esta habilitado, la peticion se rechaza.
 * @param {import('express').Request} req - Peticion HTTP; debe incluir `Authorization: Bearer <token>`.
 * @param {import('express').Response} res - Respuesta HTTP (no se modifica directamente).
 * @param {import('express').NextFunction} next - Continua con el siguiente middleware o controlador.
 * @returns {void}
 * @throws {AppError} Codigo 401 con los mensajes `Token requerido`, `Token invalido o expirado` o `Usuario no valido`.
 */
function autenticar(req, res, next) {
  const [esquema, token] = (req.headers.authorization || '').split(' ');
  if (esquema !== 'Bearer' || !token) return next(new AppError('Token requerido', 401));

  try {
    const payload = jwt.verify(token, jwtSecret);
    const usuario = buscarPorId(payload.id);
    if (!usuario || !usuario.activo) return next(new AppError('Usuario no válido', 401));
    req.usuario = usuario;
    next();
  } catch (e) {
    next(new AppError('Token inválido o expirado', 401));
  }
}

/**
 * @function permitir
 * @description Fabrica un middleware de autorizacion por rol. Debe ejecutarse despues
 * de `autenticar`, ya que depende de `req.usuario.rol`.
 * @param {...('ADMIN'|'VENDEDOR')} roles - Roles autorizados para ejecutar la ruta.
 * @returns {import('express').RequestHandler} Middleware que permite continuar solo si el rol del usuario esta autorizado.
 * @throws {AppError} Codigo 403 si el rol del usuario no esta dentro de los roles permitidos.
 */
const permitir = (...roles) => (req, res, next) =>
  roles.includes(req.usuario.rol) ? next() : next(new AppError('No tiene permisos para esta acción', 403));

module.exports = { autenticar, permitir };
