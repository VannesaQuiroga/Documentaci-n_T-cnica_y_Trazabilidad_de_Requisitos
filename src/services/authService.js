const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../data/store');
const { jwtSecret, jwtExpiresIn } = require('../config');
const AppError = require('../utils/AppError');

/**
 * @function login
 * @description Autentica a un usuario validando sus credenciales contra el almacen
 * de datos, verifica que la cuenta este activa y emite un token JWT firmado con el
 * secreto configurado. La contrasena se compara con bcrypt y el hash nunca se
 * incluye en la respuesta.
 * @param {string} usuario - Nombre de usuario registrado (por ejemplo, `vendedor1`).
 * @param {string} password - Contrasena en texto plano ingresada por el usuario.
 * @returns {{ token: string, usuario: { id: number, usuario: string, nombre: string, rol: string } }}
 * Objeto con el token JWT (vigencia definida por `JWT_EXPIRES_IN`) y el perfil publico del usuario.
 * @throws {AppError} Codigo 400 si `usuario` o `password` no fueron enviados.
 * @throws {AppError} Codigo 401 si el usuario no existe o la contrasena es incorrecta.
 * @throws {AppError} Codigo 403 si la cuenta del usuario esta inactiva.
 */
function login(usuario, password) {
  if (!usuario || !password) throw new AppError('Usuario y contraseña son obligatorios');

  const encontrado = getDb().usuarios.find((u) => u.usuario === usuario);
  if (!encontrado || !bcrypt.compareSync(password, encontrado.password)) {
    throw new AppError('Credenciales inválidas', 401);
  }
  if (!encontrado.activo) throw new AppError('Usuario inactivo', 403);

  const token = jwt.sign({ id: encontrado.id, rol: encontrado.rol }, jwtSecret, { expiresIn: jwtExpiresIn });
  return { token, usuario: perfil(encontrado) };
}

/**
 * @function perfil
 * @description Construye la representacion publica de un usuario, omitiendo
 * informacion sensible como el hash de la contrasena o el estado de la cuenta.
 * @param {{ id: number, usuario: string, nombre: string, rol: string }} u - Usuario interno del almacen de datos.
 * @returns {{ id: number, usuario: string, nombre: string, rol: string }} Perfil publico del usuario.
 */
function perfil(u) {
  return { id: u.id, usuario: u.usuario, nombre: u.nombre, rol: u.rol };
}

/**
 * @function buscarPorId
 * @description Busca un usuario por su identificador interno. Es utilizada por el
 * middleware de autenticacion para revalidar el usuario asociado al token JWT.
 * @param {number} id - Identificador numerico del usuario.
 * @returns {{ id: number, usuario: string, nombre: string, rol: string, password: string, activo: boolean }|undefined}
 * Usuario encontrado o `undefined` si no existe.
 */
function buscarPorId(id) {
  return getDb().usuarios.find((u) => u.id === id);
}

module.exports = { login, perfil, buscarPorId };
