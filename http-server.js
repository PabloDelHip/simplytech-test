import express from 'express';
import cors from 'cors';

import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import responseTime from 'response-time';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import env from './src/config/env.js';
import logger from './src/config/logger.js';

const isProd = env.NODE_ENV === 'production';


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const specPath = path.join(__dirname, 'src/infra/docs/openapi.json');

function setupSwagger(app) {
  app.get('/docs.json', (_req, res) => res.sendFile(specPath));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(null, {
    explorer: true,
    swaggerUrl: '/docs.json',
  }));
}

export function setupMiddlewares(app) {
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  }));

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: false, limit: '5mb' }));

  //sanitize MONGO
  app.use((req, _res, next) => {
    const opts = { allowDots: false, replaceWith: '_' };
    if (req.body)   req.body   = mongoSanitize.sanitize(req.body, opts);
    if (req.params) req.params = mongoSanitize.sanitize(req.params, opts);
    if (req.query && typeof req.query === 'object') {
      const cleaned = mongoSanitize.sanitize({ ...req.query }, opts);
      for (const k of Object.keys(req.query)) delete req.query[k];
      Object.assign(req.query, cleaned);
    }
    next();
  });

  const corsOptions = {
    origin: '*',
    methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
  };
  app.use(cors(corsOptions));

  const morganFormat = isProd
  ? ':remote-addr :method :url :status :res[content-length] - :response-time ms'
  : 'dev';
  app.use(morgan(morganFormat, {
    skip: (req) => req.method === 'OPTIONS' || req.path === '/'
  }));


  // Rate limit global
  app.use(rateLimit({
    windowMs: 30 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes, inténtalo de nuevo más tarde.' },
  }));
}

function setupRoutes(app, routes) {
  if (Array.isArray(routes)) {
    for (const r of routes) {
      if (r && r.path && r.router) {
        app.use(r.path, r.router);
        logger.info(`[http-server] montado ${r.path}`);
      } else {
        logger.warn('[http-server] ruta ignorada por formato inválido:', r);
      }
    }
  }
}

export default class HttpServer {
  constructor(router, port = 3000) {
    this.app = express();
    this.port = port;
    this.router = router;
    this.initConfig();
  }

  initConfig() {
    setupMiddlewares(this.app);
    setupRoutes(this.app, this.router);
    setupSwagger(this.app)

    // health
    this.app.get('/', (_req, res) => res.json({ ok: true }));

    // 404
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Not Found', path: req.originalUrl });
    });

    // handler de errores
    this.app.use((err, req, res, _next) => {

      const status = Number(err.status) || Number(err.statusCode) || 500;
    
      const inferredCode =
        err.code ||
        (status === 400 && 'BAD_REQUEST') ||
        (status === 401 && 'AUTH_INVALID') ||
        (status === 403 && 'FORBIDDEN') ||
        (status === 404 && 'NOT_FOUND') ||
        (status === 409 && 'CONFLICT') ||
        (status >= 500 && 'INTERNAL_ERROR') ||
        'UNKNOWN_ERROR';
    
      const body = {
        code: inferredCode,
        error: err.message || 'Internal Error',
        status,
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
      };
    
      if (err.details) body.details = err.details;
    
      if (process.env.NODE_ENV !== 'production' && err.stack) {
        body.stack = err.stack;
      }
    
      res.status(status).json(body);
    });
  }

  listen() {
    if (env.NODE_ENV !== 'test') {
      const server = this.app.listen(this.port, () => {
        console.log(`HTTP running on :${this.port}`);
      });
      return server;
    }
    return this.app;
  }
}
