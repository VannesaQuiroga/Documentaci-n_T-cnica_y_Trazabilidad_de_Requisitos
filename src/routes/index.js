const { Router } = require('express');
const { autenticar, permitir } = require('../middlewares/auth');
const auth = require('../controllers/authController');
const sorteos = require('../controllers/sorteoController');
const tickets = require('../controllers/ticketController');
const caja = require('../controllers/cajaController');

const router = Router();

router.post('/auth/login', auth.login);
router.get('/auth/perfil', autenticar, auth.perfil);

router.get('/sorteos', autenticar, sorteos.listar);
router.get('/sorteos/:id', autenticar, sorteos.obtener);
router.post('/sorteos', autenticar, permitir('ADMIN'), sorteos.crear);
router.post('/sorteos/:id/resultado', autenticar, permitir('ADMIN'), sorteos.registrarResultado);

router.post('/tickets/chance', autenticar, permitir('VENDEDOR'), tickets.venderChance);
router.post('/tickets/baloto', autenticar, permitir('VENDEDOR'), tickets.venderBaloto);
router.get('/tickets', autenticar, tickets.listar);
router.get('/tickets/:codigo', autenticar, tickets.consultar);
router.post('/tickets/:codigo/anular', autenticar, tickets.anular);
router.post('/tickets/:codigo/pagar', autenticar, permitir('VENDEDOR'), tickets.pagar);

router.get('/caja/resumen', autenticar, caja.resumen);
router.post('/caja/cierre', autenticar, permitir('VENDEDOR'), caja.cerrar);

module.exports = router;
