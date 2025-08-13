import { Router } from 'express';
import { AuthControllerInstance } from './index.js';
import { auth } from '../../middlewares/auth.middleware.js';
import logger from '../../config/logger.js';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    logger.info(`[AuthRouter] POST /login - Intento de login para email: ${req.body.email}`);
    const { status, data } = await AuthControllerInstance.login(req.body);
    logger.info(`[AuthRouter] POST /login - Login exitoso para email: ${req.body.email}`);
    res.status(status).json(data);
  } catch (err) {
    logger.error(`[AuthRouter] POST /login - Error en login para email: ${req.body.email} - ${err.message}`);
    next(err);
  }
});

router.get('/me', auth, async (req, res, next) => {
  try {
    logger.info(`[AuthRouter] GET /me - Usuario autenticado ID: ${req.user.id}`);
    const { status, data } = await AuthControllerInstance.me(req.user.id);
    logger.info(`[AuthRouter] GET /me - Datos obtenidos para usuario ID: ${req.user.id}`);
    res.status(status).json(data);
  } catch (err) {
    logger.error(`[AuthRouter] GET /me - Error obteniendo datos para usuario ID: ${req.user.id} - ${err.message}`);
    next(err);
  }
});

export default { path: '/auth', router };
