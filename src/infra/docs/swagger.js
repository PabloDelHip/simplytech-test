import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import env from '../../config/env.js';

export function mountSwagger(app, {
  title = 'Eventos API',
  version = '1.0.0',
  description = 'API para usuarios y eventos',
  apis = ['./src/modules/**/*.routes.js'],
  pathUI = '/docs',
  pathJSON = '/docs.json',
} = {}) {
  const definition = {
    openapi: '3.0.3',
    info: { title, version, description },
    servers: [{ url: env.API_BASE_URL || `http://localhost:${env.PORT || 3000}` }],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      schemas: {
        Error: { type: 'object', properties: { error: { type: 'string' } } }
      }
    },
  };

  const spec = swaggerJSDoc({ definition, apis });

  app.get(pathJSON, (_req, res) => {
    res.type('application/json').send(spec);
  });

  app.use(pathUI, swaggerUi.serve, swaggerUi.setup(spec, { explorer: true }));
}
