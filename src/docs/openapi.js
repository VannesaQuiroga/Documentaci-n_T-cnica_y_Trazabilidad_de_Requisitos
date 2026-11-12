const jsonError = (description) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
});

const security = [{ bearerAuth: [] }];

const errorResponses = {
  Validacion: jsonError('Datos invalidos o JSON mal formado'),
  NoAutorizado: jsonError('Token ausente, invalido o credenciales incorrectas'),
  Prohibido: jsonError('Sin permisos para la accion o usuario inactivo'),
  NoEncontrado: jsonError('Recurso no encontrado'),
  Conflicto: jsonError('Conflicto con el estado actual del recurso'),
  Caducado: jsonError('Premio caducado'),
  ErrorInterno: jsonError('Error interno del servidor'),
};

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'integer', example: 1 },
  description: 'Identificador del sorteo',
};

const codigoParam = {
  name: 'codigo',
  in: 'path',
  required: true,
  schema: { type: 'string', example: 'CH-3F9A2B7C' },
  description: 'Codigo unico del tiquete',
};

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Puesto de Chance API',
    version: '1.0.0',
    description: [
      'API REST para la operacion de un puesto de chance y Baloto.',
      '',
      '**Autenticacion:** obtenga un token en `POST /api/v1/auth/login` y envielo en el',
      'encabezado `Authorization: Bearer <token>`.',
      '',
      '**Usuarios de demostracion:** `admin / admin123`, `vendedor1 / vende123`,',
      '`vendedor2 / vende456`.',
      '',
      '**Persistencia:** almacen en memoria; los datos se reinician al reiniciar el servidor.',
    ].join('\n'),
  },
  servers: [{ url: 'http://localhost:3000', description: 'Servidor local' }],
  tags: [
    { name: 'Salud', description: 'Estado del servicio' },
    { name: 'Autenticacion', description: 'Inicio de sesion y perfil' },
    { name: 'Sorteos', description: 'Gestion de sorteos y registro de resultados' },
    { name: 'Tiquetes', description: 'Venta, consulta, anulacion y pago de premios' },
    { name: 'Caja', description: 'Resumen y cierre diario de caja' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenido en POST /api/v1/auth/login',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Credenciales invalidas' },
        },
        required: ['error'],
      },
      Health: {
        type: 'object',
        properties: {
          estado: { type: 'string', example: 'ok' },
          hora: { type: 'string', format: 'date-time' },
        },
        required: ['estado', 'hora'],
      },
      Usuario: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 2 },
          usuario: { type: 'string', example: 'vendedor1' },
          nombre: { type: 'string', example: 'Ana Perez' },
          rol: { type: 'string', enum: ['ADMIN', 'VENDEDOR'], example: 'VENDEDOR' },
        },
        required: ['id', 'usuario', 'nombre', 'rol'],
      },
      LoginRequest: {
        type: 'object',
        properties: {
          usuario: { type: 'string', example: 'vendedor1' },
          password: { type: 'string', format: 'password', example: 'vende123' },
        },
        required: ['usuario', 'password'],
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          usuario: { $ref: '#/components/schemas/Usuario' },
        },
        required: ['token', 'usuario'],
      },
      ResultadoBaloto: {
        type: 'object',
        properties: {
          numeros: {
            type: 'array',
            items: { type: 'integer', minimum: 1, maximum: 43 },
            minItems: 5,
            maxItems: 5,
            example: [3, 10, 21, 30, 43],
          },
          superbalota: { type: 'integer', minimum: 1, maximum: 16, example: 7 },
        },
        required: ['numeros', 'superbalota'],
      },
      Resultado: {
        nullable: true,
        description: 'Resultado oficial: cadena de 4 digitos (CHANCE) u objeto de Baloto',
        oneOf: [
          { type: 'string', pattern: '^\\d{4}$', example: '1234' },
          { $ref: '#/components/schemas/ResultadoBaloto' },
        ],
      },
      Sorteo: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          tipo: { type: 'string', enum: ['CHANCE', 'BALOTO'], example: 'CHANCE' },
          nombre: { type: 'string', example: 'Loteria de Bogota' },
          fecha: { type: 'string', format: 'date-time' },
          estado: { type: 'string', enum: ['ABIERTO', 'JUGADO'], example: 'ABIERTO' },
          resultado: { $ref: '#/components/schemas/Resultado' },
          acumulado: { type: 'integer', example: 0 },
          jugadoEn: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'tipo', 'nombre', 'fecha', 'estado', 'resultado', 'acumulado'],
      },
      SorteoResumen: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Loteria de Bogota' },
          fecha: { type: 'string', format: 'date-time' },
          estado: { type: 'string', enum: ['ABIERTO', 'JUGADO'] },
          resultado: { $ref: '#/components/schemas/Resultado' },
        },
      },
      SorteoInput: {
        type: 'object',
        properties: {
          tipo: { type: 'string', enum: ['CHANCE', 'BALOTO'], example: 'CHANCE' },
          nombre: { type: 'string', example: 'Loteria del Valle' },
          fecha: {
            type: 'string',
            format: 'date-time',
            example: '2026-12-01T23:00:00.000Z',
            description: 'Fecha futura del sorteo',
          },
          acumulado: {
            type: 'integer',
            minimum: 0,
            default: 0,
            description: 'Solo aplica para sorteos de tipo BALOTO',
          },
        },
        required: ['tipo', 'nombre', 'fecha'],
      },
      ResultadoChanceInput: {
        type: 'object',
        properties: {
          resultado: { type: 'string', pattern: '^\\d{4}$', example: '1234' },
        },
        required: ['resultado'],
      },
      ResultadoBalotoInput: {
        type: 'object',
        properties: {
          resultado: { $ref: '#/components/schemas/ResultadoBaloto' },
        },
        required: ['resultado'],
      },
      ApuestaInput: {
        type: 'object',
        properties: {
          numero: { type: 'string', pattern: '^\\d{1,4}$', example: '1234' },
          modalidad: {
            type: 'string',
            enum: ['DIRECTO', 'COMBINADO'],
            default: 'DIRECTO',
            description: 'COMBINADO solo aplica para 3 o 4 cifras',
          },
          valor: {
            type: 'integer',
            example: 2000,
            description: 'Multiplo de 100 dentro del rango configurado',
          },
        },
        required: ['numero', 'valor'],
      },
      Apuesta: {
        allOf: [
          { $ref: '#/components/schemas/ApuestaInput' },
          {
            type: 'object',
            properties: {
              cifras: { type: 'integer', minimum: 1, maximum: 4, example: 4 },
              premio: { type: 'integer', example: 9000000 },
            },
            required: ['cifras'],
          },
        ],
      },
      JugadaInput: {
        oneOf: [
          {
            type: 'object',
            properties: {
              numeros: {
                type: 'array',
                items: { type: 'integer', minimum: 1, maximum: 43 },
                minItems: 5,
                maxItems: 5,
                example: [1, 2, 3, 4, 5],
                description: '5 numeros unicos entre 1 y 43',
              },
              superbalota: { type: 'integer', minimum: 1, maximum: 16, example: 6 },
            },
            required: ['numeros', 'superbalota'],
          },
          {
            type: 'object',
            properties: {
              aleatoria: { type: 'boolean', example: true },
            },
            required: ['aleatoria'],
          },
        ],
      },
      Jugada: {
        type: 'object',
        properties: {
          numeros: {
            type: 'array',
            items: { type: 'integer' },
            example: [1, 2, 3, 4, 5],
          },
          superbalota: { type: 'integer', example: 6 },
          premio: { type: 'integer', example: 0 },
        },
      },
      Anulacion: {
        type: 'object',
        properties: {
          usuarioId: { type: 'integer', example: 2 },
          motivo: { type: 'string', example: 'Cliente cambio el numero' },
          fecha: { type: 'string', format: 'date-time' },
        },
      },
      Ticket: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          codigo: { type: 'string', example: 'CH-3F9A2B7C' },
          tipo: { type: 'string', enum: ['CHANCE', 'BALOTO'], example: 'CHANCE' },
          sorteoId: { type: 'integer', example: 1 },
          vendedorId: { type: 'integer', example: 2 },
          cliente: { type: 'string', nullable: true, example: 'Carlos Ruiz' },
          apuestas: {
            type: 'array',
            items: { $ref: '#/components/schemas/Apuesta' },
          },
          jugadas: {
            type: 'array',
            items: { $ref: '#/components/schemas/Jugada' },
          },
          total: { type: 'integer', example: 2000 },
          estado: {
            type: 'string',
            enum: ['ACTIVO', 'ANULADO', 'PAGADO', 'CADUCADO'],
            example: 'ACTIVO',
          },
          premio: { type: 'integer', nullable: true, example: null },
          creadoEn: { type: 'string', format: 'date-time' },
          anulacion: { $ref: '#/components/schemas/Anulacion' },
        },
        required: ['id', 'codigo', 'tipo', 'sorteoId', 'vendedorId', 'total', 'estado', 'creadoEn'],
      },
      TicketConsulta: {
        allOf: [
          { $ref: '#/components/schemas/Ticket' },
          {
            type: 'object',
            properties: {
              sorteo: { $ref: '#/components/schemas/SorteoResumen' },
              ganador: {
                type: 'boolean',
                nullable: true,
                description: 'null si el sorteo no se ha jugado',
              },
            },
          },
        ],
      },
      TicketChanceInput: {
        type: 'object',
        properties: {
          sorteoId: { type: 'integer', example: 1 },
          cliente: { type: 'string', nullable: true, example: 'Carlos Ruiz' },
          apuestas: {
            type: 'array',
            minItems: 1,
            maxItems: 5,
            items: { $ref: '#/components/schemas/ApuestaInput' },
          },
        },
        required: ['sorteoId', 'apuestas'],
      },
      TicketBalotoInput: {
        type: 'object',
        properties: {
          sorteoId: { type: 'integer', example: 3 },
          cliente: { type: 'string', nullable: true, example: 'Maria Lopez' },
          jugadas: {
            type: 'array',
            minItems: 1,
            maxItems: 10,
            items: { $ref: '#/components/schemas/JugadaInput' },
          },
        },
        required: ['sorteoId', 'jugadas'],
      },
      AnulacionInput: {
        type: 'object',
        properties: {
          motivo: { type: 'string', example: 'Cliente cambio el numero' },
        },
        required: ['motivo'],
      },
      Pago: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          ticketId: { type: 'integer', example: 1 },
          codigo: { type: 'string', example: 'CH-3F9A2B7C' },
          usuarioId: { type: 'integer', example: 2 },
          valor: { type: 'integer', example: 9000000 },
          fecha: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'ticketId', 'codigo', 'usuarioId', 'valor', 'fecha'],
      },
      ResumenCaja: {
        type: 'object',
        properties: {
          vendedorId: { type: 'integer', example: 2 },
          fecha: { type: 'string', example: '2026-11-12' },
          tiquetesVendidos: { type: 'integer', example: 2 },
          tiquetesAnulados: { type: 'integer', example: 0 },
          ventasChance: { type: 'integer', example: 5000 },
          ventasBaloto: { type: 'integer', example: 5700 },
          totalVendido: { type: 'integer', example: 10700 },
          premiosPagados: { type: 'integer', example: 0 },
          totalPagado: { type: 'integer', example: 0 },
          saldoEsperado: { type: 'integer', example: 10700 },
          cerrada: { type: 'boolean', example: false },
        },
      },
      CierreCajaInput: {
        type: 'object',
        properties: {
          efectivoReportado: {
            type: 'integer',
            minimum: 0,
            example: 10000,
            description: 'Efectivo contado por el vendedor',
          },
          fecha: {
            type: 'string',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            example: '2026-11-12',
            description: 'Fecha de cierre; por defecto la fecha local actual',
          },
        },
        required: ['efectivoReportado'],
      },
      CierreCaja: {
        allOf: [
          { $ref: '#/components/schemas/ResumenCaja' },
          {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              cerrada: { type: 'boolean', example: true },
              efectivoReportado: { type: 'integer', example: 10000 },
              diferencia: { type: 'integer', example: -700 },
              estado: {
                type: 'string',
                enum: ['CUADRADA', 'SOBRANTE', 'FALTANTE'],
                example: 'FALTANTE',
              },
              creadoEn: { type: 'string', format: 'date-time' },
            },
            required: ['id', 'cerrada', 'efectivoReportado', 'diferencia', 'estado', 'creadoEn'],
          },
        ],
      },
    },
    responses: errorResponses,
  },
  paths: {
    '/health': {
      get: {
        tags: ['Salud'],
        summary: 'Estado del servicio',
        security: [],
        responses: {
          200: {
            description: 'Servicio disponible',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Health' } } },
          },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Autenticacion'],
        summary: 'Iniciar sesion y obtener token JWT',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          200: {
            description: 'Autenticacion exitosa',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
          },
          400: { $ref: '#/components/responses/Validacion' },
          401: { $ref: '#/components/responses/NoAutorizado' },
          403: { $ref: '#/components/responses/Prohibido' },
          500: { $ref: '#/components/responses/ErrorInterno' },
        },
      },
    },
    '/api/v1/auth/perfil': {
      get: {
        tags: ['Autenticacion'],
        summary: 'Perfil del usuario autenticado',
        security,
        responses: {
          200: {
            description: 'Perfil del usuario',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } },
          },
          401: { $ref: '#/components/responses/NoAutorizado' },
          500: { $ref: '#/components/responses/ErrorInterno' },
        },
      },
    },
    '/api/v1/sorteos': {
      get: {
        tags: ['Sorteos'],
        summary: 'Listar sorteos',
        security,
        parameters: [
          {
            name: 'tipo',
            in: 'query',
            schema: { type: 'string', enum: ['CHANCE', 'BALOTO'] },
            description: 'Filtra por tipo de sorteo',
          },
          {
            name: 'estado',
            in: 'query',
            schema: { type: 'string', enum: ['ABIERTO', 'JUGADO'] },
            description: 'Filtra por estado del sorteo',
          },
        ],
        responses: {
          200: {
            description: 'Listado de sorteos',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Sorteo' } },
              },
            },
          },
          401: { $ref: '#/components/responses/NoAutorizado' },
          500: { $ref: '#/components/responses/ErrorInterno' },
        },
      },
      post: {
        tags: ['Sorteos'],
        summary: 'Crear sorteo (ADMIN)',
        security,
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SorteoInput' } } },
        },
        responses: {
          201: {
            description: 'Sorteo creado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Sorteo' } } },
          },
          400: { $ref: '#/components/responses/Validacion' },
          401: { $ref: '#/components/responses/NoAutorizado' },
          403: { $ref: '#/components/responses/Prohibido' },
          500: { $ref: '#/components/responses/ErrorInterno' },
        },
      },
    },
    '/api/v1/sorteos/{id}': {
      get: {
        tags: ['Sorteos'],
        summary: 'Obtener sorteo por id',
        security,
        parameters: [idParam],
        responses: {
          200: {
            description: 'Detalle del sorteo',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Sorteo' } } },
          },
          401: { $ref: '#/components/responses/NoAutorizado' },
          404: { $ref: '#/components/responses/NoEncontrado' },
          500: { $ref: '#/components/responses/ErrorInterno' },
        },
      },
    },
    '/api/v1/sorteos/{id}/resultado': {
      post: {
        tags: ['Sorteos'],
        summary: 'Registrar resultado y liquidar premios (ADMIN)',
        security,
        parameters: [idParam],
        requestBody: {
          required: true,
          description: 'Resultado de 4 digitos para CHANCE o jugada ganadora para BALOTO',
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  { $ref: '#/components/schemas/ResultadoChanceInput' },
                  { $ref: '#/components/schemas/ResultadoBalotoInput' },
                ],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Sorteo jugado y tiquetes liquidados',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Sorteo' } } },
          },
          400: { $ref: '#/components/responses/Validacion' },
          401: { $ref: '#/components/responses/NoAutorizado' },
          403: { $ref: '#/components/responses/Prohibido' },
          404: { $ref: '#/components/responses/NoEncontrado' },
          409: { $ref: '#/components/responses/Conflicto' },
          500: { $ref: '#/components/responses/ErrorInterno' },
        },
      },
    },
    '/api/v1/tickets/chance': {
      post: {
        tags: ['Tiquetes'],
        summary: 'Vender tiquete de chance (VENDEDOR)',
        security,
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TicketChanceInput' } } },
        },
        responses: {
          201: {
            description: 'Tiquete de chance creado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Ticket' } } },
          },
          400: { $ref: '#/components/responses/Validacion' },
          401: { $ref: '#/components/responses/NoAutorizado' },
          403: { $ref: '#/components/responses/Prohibido' },
          404: { $ref: '#/components/responses/NoEncontrado' },
          409: { $ref: '#/components/responses/Conflicto' },
          500: { $ref: '#/components/responses/ErrorInterno' },
        },
      },
    },
    '/api/v1/tickets/baloto': {
      post: {
        tags: ['Tiquetes'],
        summary: 'Vender tiquete de Baloto (VENDEDOR)',
        security,
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TicketBalotoInput' } } },
        },
        responses: {
          201: {
            description: 'Tiquete de Baloto creado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Ticket' } } },
          },
          400: { $ref: '#/components/responses/Validacion' },
          401: { $ref: '#/components/responses/NoAutorizado' },
          403: { $ref: '#/components/responses/Prohibido' },
          404: { $ref: '#/components/responses/NoEncontrado' },
          409: { $ref: '#/components/responses/Conflicto' },
          500: { $ref: '#/components/responses/ErrorInterno' },
        },
      },
    },
    '/api/v1/tickets': {
      get: {
        tags: ['Tiquetes'],
        summary: 'Listar tiquetes (ADMIN ve todos; VENDEDOR solo los propios)',
        security,
        parameters: [
          {
            name: 'fecha',
            in: 'query',
            schema: { type: 'string', example: '2026-11-12' },
            description: 'Prefijo de fecha ISO de creacion (YYYY-MM-DD)',
          },
          {
            name: 'estado',
            in: 'query',
            schema: { type: 'string', enum: ['ACTIVO', 'ANULADO', 'PAGADO', 'CADUCADO'] },
            description: 'Filtra por estado del tiquete',
          },
        ],
        responses: {
          200: {
            description: 'Listado de tiquetes',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Ticket' } },
              },
            },
          },
          401: { $ref: '#/components/responses/NoAutorizado' },
          500: { $ref: '#/components/responses/ErrorInterno' },
        },
      },
    },
    '/api/v1/tickets/{codigo}': {
      get: {
        tags: ['Tiquetes'],
        summary: 'Consultar tiquete por codigo',
        security,
        parameters: [codigoParam],
        responses: {
          200: {
            description: 'Tiquete con sorteo y estado de ganador',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/TicketConsulta' } } },
          },
          401: { $ref: '#/components/responses/NoAutorizado' },
          404: { $ref: '#/components/responses/NoEncontrado' },
          500: { $ref: '#/components/responses/ErrorInterno' },
        },
      },
    },
    '/api/v1/tickets/{codigo}/anular': {
      post: {
        tags: ['Tiquetes'],
        summary: 'Anular tiquete',
        description: [
          'Un VENDEDOR solo puede anular sus propios tiquetes dentro de los minutos',
          'configurados en `MINUTOS_ANULACION`. Un ADMIN puede anular cualquiera.',
        ].join(' '),
        security,
        parameters: [codigoParam],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AnulacionInput' } } },
        },
        responses: {
          200: {
            description: 'Tiquete anulado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Ticket' } } },
          },
          400: { $ref: '#/components/responses/Validacion' },
          401: { $ref: '#/components/responses/NoAutorizado' },
          403: { $ref: '#/components/responses/Prohibido' },
          404: { $ref: '#/components/responses/NoEncontrado' },
          409: { $ref: '#/components/responses/Conflicto' },
          500: { $ref: '#/components/responses/ErrorInterno' },
        },
      },
    },
    '/api/v1/tickets/{codigo}/pagar': {
      post: {
        tags: ['Tiquetes'],
        summary: 'Pagar premio de un tiquete (VENDEDOR)',
        security,
        parameters: [codigoParam],
        responses: {
          200: {
            description: 'Pago registrado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Pago' } } },
          },
          401: { $ref: '#/components/responses/NoAutorizado' },
          403: { $ref: '#/components/responses/Prohibido' },
          404: { $ref: '#/components/responses/NoEncontrado' },
          409: { $ref: '#/components/responses/Conflicto' },
          410: { $ref: '#/components/responses/Caducado' },
          500: { $ref: '#/components/responses/ErrorInterno' },
        },
      },
    },
    '/api/v1/caja/resumen': {
      get: {
        tags: ['Caja'],
        summary: 'Resumen diario de caja',
        security,
        parameters: [
          {
            name: 'fecha',
            in: 'query',
            schema: { type: 'string', example: '2026-11-12' },
            description: 'Fecha a consultar (YYYY-MM-DD); por defecto la fecha local actual',
          },
          {
            name: 'vendedorId',
            in: 'query',
            schema: { type: 'integer', example: 2 },
            description: 'Solo ADMIN puede consultar la caja de otro vendedor',
          },
        ],
        responses: {
          200: {
            description: 'Resumen de caja',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ResumenCaja' } } },
          },
          401: { $ref: '#/components/responses/NoAutorizado' },
          500: { $ref: '#/components/responses/ErrorInterno' },
        },
      },
    },
    '/api/v1/caja/cierre': {
      post: {
        tags: ['Caja'],
        summary: 'Cerrar caja del dia (VENDEDOR)',
        security,
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CierreCajaInput' } } },
        },
        responses: {
          201: {
            description: 'Cierre de caja registrado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CierreCaja' } } },
          },
          400: { $ref: '#/components/responses/Validacion' },
          401: { $ref: '#/components/responses/NoAutorizado' },
          403: { $ref: '#/components/responses/Prohibido' },
          409: { $ref: '#/components/responses/Conflicto' },
          500: { $ref: '#/components/responses/ErrorInterno' },
        },
      },
    },
  },
};
