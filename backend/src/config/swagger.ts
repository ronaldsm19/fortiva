/** Especificación OpenAPI mínima. Se sirve en /docs con swagger-ui-express. */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Fortiva API',
    version: '0.1.0',
    description: 'REST API de Fortiva — finanzas familiares multi-tenant. Fase 2: auth + tenant + trial.',
  },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      RegisterInput: {
        type: 'object',
        required: ['email', 'password', 'fullName', 'accountName'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          fullName: { type: 'string' },
          accountName: { type: 'string', example: 'Hogar Rodríguez' },
          nationalId: { type: 'string' },
          phone: { type: 'string' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      RefreshInput: {
        type: 'object',
        required: ['refreshToken'],
        properties: { refreshToken: { type: 'string' } },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          user: { $ref: '#/components/schemas/Me' },
        },
      },
      Me: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          fullName: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'member'] },
          account: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              plan: { type: 'string' },
              status: { type: 'string' },
              trialEndsAt: { type: 'string', format: 'date-time', nullable: true },
              trialDaysLeft: { type: 'integer', nullable: true },
            },
          },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Crea cuenta (tenant) + usuario admin',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterInput' } } } },
        responses: { '201': { description: 'Creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } } },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login (arranca trial 7d en el primer ingreso)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } } },
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } } },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Rota el refresh token → nuevos tokens',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshInput' } } } },
        responses: { '200': { description: 'OK' } },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Revoca el refresh token',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshInput' } } } },
        responses: { '204': { description: 'Sin contenido' } },
      },
    },
    '/me': {
      get: {
        tags: ['Users'],
        summary: 'Perfil del usuario + cuenta + estado de trial',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Me' } } } } },
      },
    },
    '/account/couple': {
      get: {
        tags: ['Account'],
        summary: 'Config de modo pareja',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
      patch: {
        tags: ['Account'],
        summary: 'Actualiza modo pareja / split',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },
  },
} as const;
