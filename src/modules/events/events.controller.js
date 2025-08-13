import { RequestValidation, ObjectParser } from '../../support/index.js';
import { createEventSchema, eventIdParamSchema } from './dto/index.js';
import logger from '../../config/logger.js';

const { fullValidate } = RequestValidation;

export default class EventsController {
  constructor(eventsService) {
    this.eventsService = eventsService;
  }

  async store(body) {
    logger.debug(`[EventsController] store - Inicio creación de evento`);
    const values = fullValidate(createEventSchema, body);
    const created = await this.eventsService.createEvent(values);
    logger.info(`[EventsController] store - Evento creado id=${created?.id || created?._id || '(desconocido)'}`);
    return ObjectParser.responseOf(201, created);
  }

  async destroy(userId, params) {
    logger.debug(`[EventsController] destroy - userId=${userId} eventId=${params?.id}`);
    const { id: eventId } = fullValidate(eventIdParamSchema, params);
    await this.eventsService.deleteEvent({ userId, eventId });
    logger.info(`[EventsController] destroy - Evento eliminado id=${eventId}`);
    return ObjectParser.responseOf(200, { deleted: true, id: eventId });
  }

  async available(query) {
    logger.debug(`[EventsController] available - query from=${query?.from || 'now'} limit=${query?.limit || 50} page=${query?.page || 1}`);
    const from = query?.from ? new Date(String(query.from)) : new Date();
    if (Number.isNaN(from.getTime())) {
      logger.warn(`[EventsController] available - Parámetro "from" inválido: ${query?.from}`);
      const err = new Error('Parámetro "from" inválido'); err.status = 400; throw err;
    }

    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 50));
    const page  = Math.max(1, Number(query?.page) || 1);
    const skip  = (page - 1) * limit;

    const data = await this.eventsService.listAvailableEvents({ from, limit, skip });
    logger.info(`[EventsController] available - Encontrados=${Array.isArray(data) ? data.length : 0}`);
    return { status: 200, data };
  }

  async update(userId, params, body) {
    logger.debug(`[EventsController] update - userId=${userId} eventId=${params?.id}`);
    const { id: eventId } = fullValidate(eventIdParamSchema, params);
    const patch = fullValidate(createEventSchema, body);
    const data = await this.eventsService.updateEvent({ userId, eventId, patch });
    logger.info(`[EventsController] update - Evento actualizado id=${eventId}`);
    return ObjectParser.responseOf(200, data);
  }

  async register(userId, params) {
    logger.debug(`[EventsController] register - userId=${userId} eventId=${params?.id}`);
    const { id: eventId } = params;
    const data = await this.eventsService.registerUserToEvent({ eventId, userId });
    logger.info(`[EventsController] register - Usuario ${userId} registrado en evento ${eventId}`);
    return { status: 200, data };
  }

  async unregister(userId, params) {
    logger.debug(`[EventsController] unregister - userId=${userId} eventId=${params?.id}`);
    const { id: eventId } = fullValidate(eventIdParamSchema, params);
    const data = await this.eventsService.unregisterUserFromEvent({ eventId, userId });
    logger.info(`[EventsController] unregister - Usuario ${userId} desregistrado del evento ${eventId}`);
    return ObjectParser.responseOf(200, data);
  }
}
