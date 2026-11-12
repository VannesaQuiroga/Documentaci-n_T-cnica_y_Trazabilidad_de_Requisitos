const cajaService = require('../services/cajaService');

exports.resumen = (req, res) => {
  const vendedorId = req.usuario.rol === 'ADMIN' && req.query.vendedorId
    ? Number(req.query.vendedorId)
    : req.usuario.id;
  res.json(cajaService.resumen(vendedorId, req.query.fecha));
};

exports.cerrar = (req, res) => res.status(201).json(cajaService.cerrar(req.usuario.id, req.body));
