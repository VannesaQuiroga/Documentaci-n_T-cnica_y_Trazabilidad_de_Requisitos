const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const rutas = require('./routes');
const openapi = require('./docs/openapi');
const { noEncontrado, manejarErrores } = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ estado: 'ok', hora: new Date().toISOString() }));
app.get('/api-docs.json', (req, res) => res.json(openapi));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'Puesto de Chance API' }));
app.get('/', (req, res) => res.redirect('/api-docs'));
app.use('/api/v1', rutas);

app.use(noEncontrado);
app.use(manejarErrores);

module.exports = app;
