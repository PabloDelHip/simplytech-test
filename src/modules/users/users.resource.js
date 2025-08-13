import { Router } from 'express';
import { UsersControllerInstance } from './index.js';
import { auth } from '../../middlewares/auth.middleware.js';
import logger from '../../config/logger.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    logger.info(`[UsersRouter] POST /users - Intento de crear usuario (email: ${req.body?.email})`);
    const { status, data } = await UsersControllerInstance.store(req.body);
    logger.info(`[UsersRouter] POST /users - Usuario creado con id: ${data?.id || data?._id || '(desconocido)'}`);
    res.status(status).json(data);
  } catch (err) {
    logger.error(`[UsersRouter] POST /users - Error al crear usuario (email: ${req.body?.email}) - ${err.message}`);
    next(err);
  }
});

router.patch('/', auth, async (req, res, next) => {
  try {
    logger.info(`[UsersRouter] PATCH /users - Intento de actualizar usuario id=${req.user.id}`);
    const { status, data } = await UsersControllerInstance.update(req.user.id, req.body);
    logger.info(`[UsersRouter] PATCH /users - Usuario actualizado id=${req.user.id}`);
    res.status(status).json(data);
  } catch (err) {
    logger.error(`[UsersRouter] PATCH /users - Error al actualizar usuario id=${req.user.id} - ${err.message}`);
    next(err);
  }
});

router.get('/events', auth, async (req, res, next) => {
  try {
    logger.info(`[UsersRouter] GET /users/events - Listando eventos propios user=${req.user.id}`);
    const { status, data } = await UsersControllerInstance.getEvents(req.user.id);
    logger.info(`[UsersRouter] GET /users/events - Eventos encontrados: ${Array.isArray(data) ? data.length : 0} para user=${req.user.id}`);
    res.status(status).json(data);
  } catch (err) {
    logger.error(`[UsersRouter] GET /users/events - Error listando eventos para user=${req.user.id} - ${err.message}`);
    next(err);
  }
});

router.get('/events/registered', auth, async (req, res, next) => {
  try {
    logger.info(`[UsersRouter] GET /users/events/registered - Listando eventos registrados user=${req.user.id}`);
    const { status, data } = await UsersControllerInstance.getRegisteredEvents(req.user.id);
    logger.info(`[UsersRouter] GET /users/events/registered - Eventos registrados encontrados: ${Array.isArray(data) ? data.length : 0} para user=${req.user.id}`);
    res.status(status).json(data);
  } catch (err) {
    logger.error(`[UsersRouter] GET /users/events/registered - Error listando eventos registrados para user=${req.user.id} - ${err.message}`);
    next(err);
  }
});

export default { path: '/users', router };
