const ticketService = require('../services/ticketService');

exports.venderChance = (req, res) => res.status(201).json(ticketService.venderChance(req.usuario, req.body));

exports.venderBaloto = (req, res) => res.status(201).json(ticketService.venderBaloto(req.usuario, req.body));

exports.listar = (req, res) => res.json(ticketService.listar(req.usuario, req.query));

exports.consultar = (req, res) => res.json(ticketService.consultar(req.params.codigo));

exports.anular = (req, res) =>
  res.json(ticketService.anular(req.params.codigo, req.usuario, req.body.motivo));

exports.pagar = (req, res) => res.json(ticketService.pagarPremio(req.params.codigo, req.usuario));
