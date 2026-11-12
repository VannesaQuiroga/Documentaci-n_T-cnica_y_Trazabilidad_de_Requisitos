const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const { buscarPorId } = require('../services/authService');
const AppError = require('../utils/AppError');

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

const permitir = (...roles) => (req, res, next) =>
  roles.includes(req.usuario.rol) ? next() : next(new AppError('No tiene permisos para esta acción', 403));

module.exports = { autenticar, permitir };
