import { Router } from 'express';
import EventsRepository from './events.repository.js';
import EventsService from './events.service.js';
import EventsController from './events.controller.js';
import { auth } from '../../middlewares/auth.middleware.js';
import logger from '../../config/logger.js';

const router = Router();
const eventsRepository = new EventsRepository();
const eventsService = new EventsService(eventsRepository);
const eventsController = new EventsController(eventsService);

router.get('/available', auth, async (req, res, next) => {
  try {
    logger.info(`[EventsRouter] GET /events/available - Listar eventos (userId=${req.user?.id})`);
    const { status, data } = await eventsController.available(req.user.id);
    logger.info(`[EventsRouter] GET /events/available - Encontrados=${Array.isArray(data) ? data.length : 0}`);
    res.status(status).json(data);
  } catch (err) {
    logger.error(`[EventsRouter] GET /events/available - Error: ${err.message}`);
    next(err);
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    logger.info(`[EventsRouter] DELETE /events/${req.params.id} - Eliminar evento (userId=${req.user?.id})`);
    const { status, data } = await eventsController.destroy(req.user.id, req.params);
    logger.info(`[EventsRouter] DELETE /events/${req.params.id} - Eliminado`);
    res.status(status).json(data);
  } catch (err) {
    logger.error(`[EventsRouter] DELETE /events/${req.params.id} - Error: ${err.message}`);
    next(err);
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    logger.info(`[EventsRouter] POST /events - Crear evento (userId=${req.user?.id})`);
    const { user, body } = req;
    const { status, data } = await eventsController.store({ userId: user.id, ...body });
    logger.info(`[EventsRouter] POST /events - Creado id=${data?.id || data?._id || '(desconocido)'}`);
    res.status(status).json(data);
  } catch (err) {
    logger.error(`[EventsRouter] POST /events - Error: ${err.message}`);
    next(err);
  }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    logger.info(`[EventsRouter] PUT /events/${req.params.id} - Actualizar (userId=${req.user?.id})`);
    const { status, data } = await eventsController.update(req.user.id, req.params, req.body);
    logger.info(`[EventsRouter] PUT /events/${req.params.id} - Actualizado`);
    res.status(status).json(data);
  } catch (err) {
    logger.error(`[EventsRouter] PUT /events/${req.params.id} - Error: ${err.message}`);
    next(err);
  }
});

router.post('/:id/register', auth, async (req, res, next) => {
  try {
    logger.info(`[EventsRouter] POST /events/${req.params.id}/register - Registrar user=${req.user?.id}`);
    const { status, data } = await eventsController.register(req.user.id, req.params);
    logger.info(`[EventsRouter] POST /events/${req.params.id}/register - Registrado user=${req.user?.id}`);
    res.status(status).json(data);
  } catch (err) {
    logger.error(`[EventsRouter] POST /events/${req.params.id}/register - Error: ${err.message}`);
    next(err);
  }
});

router.delete('/:id/register', auth, async (req, res, next) => {
  try {
    logger.info(`[EventsRouter] DELETE /events/${req.params.id}/register - Desregistrar user=${req.user?.id}`);
    const { status, data } = await eventsController.unregister(req.user.id, req.params);
    logger.info(`[EventsRouter] DELETE /events/${req.params.id}/register - Desregistrado user=${req.user?.id}`);
    res.status(status).json(data);
  } catch (err) {
    logger.error(`[EventsRouter] DELETE /events/${req.params.id}/register - Error: ${err.message}`);
    next(err);
  }
});

export default { path: '/events', router };
