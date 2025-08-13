import 'dotenv/config';
import env from './src/config/env.js';
import HttpServer from './http-server.js';
import { connectMongo } from './src/config/db/mongo.db.js';
import logger from './src/config/logger.js';

const port = Number(env.port || 3000);

export async function bootstrap() {
  try {
    logger.info('Iniciando aplicación...');
    
    await connectMongo(env.MONGO_URI, env.MONGO_DB_NAME);
    logger.info(`Conectado a MongoDB: ${env.MONGO_DB_NAME}`);

    const routesModule = await import('./src/routes/index.js');
    const routes = routesModule.default;

    const app = new HttpServer(routes, port);
    app.listen();
    logger.info(`Servidor HTTP escuchando en puerto ${port}`);
  } catch (err) {
    logger.error(`Fallo al iniciar la app: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
}

if (env.nodeEnv !== 'test') {
  bootstrap();
}
