import logger from '../../config/logger.js';

export default class EventsService {
  constructor(eventsRepository) {
    this.eventsRepository = eventsRepository;
  }

  async createEvent({ name, date, location, capacity, userId }) {
    logger.debug(`[EventsService] createEvent - userId=${userId} name="${name}" date=${date}`);
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) {
      logger.warn(`[EventsService] createEvent - Fecha inválida: ${date}`);
      const err = new Error('Fecha inválida'); err.status = 400; throw err;
    }

    const now = new Date();
    if (d.getTime() < now.getTime()) {
      logger.warn(`[EventsService] createEvent - Fecha en el pasado: ${d.toISOString()}`);
      const err = new Error('La fecha debe ser en el futuro (no se permiten fechas pasadas)');
      err.status = 400; throw err;
    }

    const data = {
      name: String(name).trim(),
      dateISO: d.toISOString(),
      date: d,
      location: String(location).trim(),
      capacity: Number(capacity),
      createdAt: new Date(),
      userId,
      attendees: []
    };

    const dup = await this.eventsRepository.findByNameAndDate(data.name, data.dateISO);
    if (dup) {
      logger.warn(`[EventsService] createEvent - Duplicado name="${data.name}" dateISO=${data.dateISO}`);
      const err = new Error('Ya existe un evento con ese nombre y fecha'); err.status = 409; throw err;
    }

    const created = await this.eventsRepository.create(data);
    logger.info(`[EventsService] createEvent - Evento creado id=${created._id}`);
    return { id: created._id, name: created.name, date: created.date, location: created.location, capacity: created.capacity };
  }

  async registerUserToEvent({ eventId, userId }) {
    logger.debug(`[EventsService] registerUserToEvent - eventId=${eventId} userId=${userId}`);
    const updated = await this.eventsRepository.addAttendeeIfAvailable(eventId, userId);
    if (updated) {
      logger.info(`[EventsService] registerUserToEvent - Registrado userId=${userId} en eventId=${eventId}`);
      return {
        id: updated._id,
        name: updated.name,
        attendeesCount: updated.attendees?.length ?? 0,
        capacity: updated.capacity,
      };
    }
    const ev = await this.eventsRepository.findById(eventId);
    if (!ev) {
      logger.warn(`[EventsService] registerUserToEvent - Evento no encontrado eventId=${eventId}`);
      const err = new Error('Evento no encontrado'); err.status = 404; throw err;
    }
    if (ev.attendees?.some(a => String(a) === String(userId))) {
      logger.warn(`[EventsService] registerUserToEvent - Usuario ya registrado userId=${userId} eventId=${eventId}`);
      const err = new Error('Ya estás registrado en este evento'); err.status = 409; throw err;
    }
    if ((ev.attendees?.length ?? 0) >= ev.capacity) {
      logger.warn(`[EventsService] registerUserToEvent - Evento lleno eventId=${eventId}`);
      const err = new Error('El evento está lleno'); err.status = 409; throw err;
    }
    const err = new Error('No fue posible registrar en el evento'); err.status = 400; throw err;
  }

  async listAvailableEvents({ from, limit, skip }) {
    logger.debug(`[EventsService] listAvailableEvents - from=${from?.toISOString?.() || from} limit=${limit} skip=${skip}`);
    const docs = await this.eventsRepository.findAvailable({ from, limit, skip });
    logger.info(`[EventsService] listAvailableEvents - encontrados=${docs?.length ?? 0}`);
    return docs.map(ev => ({
      id: ev._id,
      name: ev.name,
      date: ev.date,
      location: ev.location,
      capacity: ev.capacity,
      attendeesCount: ev.attendeesCount,
      availability: ev.availability,
      ownerId: ev.userId,
    }));
  }

  async unregisterUserFromEvent({ eventId, userId }) {
    logger.debug(`[EventsService] unregisterUserFromEvent - eventId=${eventId} userId=${userId}`);
    const updated = await this.eventsRepository.removeAttendee(eventId, userId);
    if (updated) {
      logger.info(`[EventsService] unregisterUserFromEvent - Desregistrado userId=${userId} de eventId=${eventId}`);
      return {
        id: updated._id,
        name: updated.name,
        attendeesCount: updated.attendees?.length ?? 0,
        capacity: updated.capacity,
      };
    }

    const ev = await this.eventsRepository.findById(eventId);
    if (!ev) {
      logger.warn(`[EventsService] unregisterUserFromEvent - Evento no encontrado eventId=${eventId}`);
      const err = new Error('Evento no encontrado'); err.status = 404; throw err;
    }
    if (!ev.attendees?.some(a => String(a) === String(userId))) {
      logger.warn(`[EventsService] unregisterUserFromEvent - Usuario no estaba registrado userId=${userId} eventId=${eventId}`);
      const err = new Error('No estás registrado en este evento'); err.status = 409; throw err;
    }
    const err = new Error('No fue posible eliminar el registro'); err.status = 400; throw err;
  }

  async deleteEvent({ userId, eventId }) {
    logger.debug(`[EventsService] deleteEvent - userId=${userId} eventId=${eventId}`);
    const deleted = await this.eventsRepository.deleteOwnedById(eventId, userId);
    if (!deleted) {
      logger.warn(`[EventsService] deleteEvent - No autorizado o no existe eventId=${eventId} userId=${userId}`);
      const err = new Error('Evento no encontrado o no autorizado');
      err.status = 404; throw err;
    }
    logger.info(`[EventsService] deleteEvent - Eliminado eventId=${eventId}`);
    return true;
  }

  async updateEvent({ userId, eventId, patch }) {
    logger.debug(`[EventsService] updateEvent - userId=${userId} eventId=${eventId}`);

    const d = new Date(patch.date);
    if (Number.isNaN(d.getTime())) {
      logger.warn(`[EventsService] updateEvent - Fecha inválida: ${patch.date}`);
      const err = new Error('Fecha inválida'); err.status = 400; throw err;
    }

    const now = new Date();
    if (d.getTime() < now.getTime()) {
      logger.warn(`[EventsService] updateEvent - Fecha en el pasado: ${d.toISOString()}`);
      const err = new Error('La fecha debe ser en el futuro (no se permiten fechas pasadas)');
      err.status = 400; throw err;
    }

    const upd = {};
    if (patch.name) upd.name = String(patch.name).trim();
    if (patch.location) upd.location = String(patch.location).trim();
    if (patch.capacity !== undefined) upd.capacity = Number(patch.capacity);
    if (patch.date) {
      const d2 = new Date(patch.date);
      if (Number.isNaN(d2.getTime())) {
        logger.warn(`[EventsService] updateEvent - Fecha inválida en patch: ${patch.date}`);
        const err = new Error('Fecha inválida'); err.status = 400; throw err;
      }
      upd.date = d2;
      upd.dateISO = d2.toISOString();
    }

    if (upd.capacity !== undefined) {
      const current = await this.eventsRepository.findById(eventId);
      if (!current) { 
        logger.warn(`[EventsService] updateEvent - Evento no encontrado al validar capacidad eventId=${eventId}`);
        const e = new Error('Evento no encontrado'); e.status=404; throw e; 
      }
      const used = current.attendees?.length ?? 0;
      if (upd.capacity < used) {
        logger.warn(`[EventsService] updateEvent - Capacidad menor a asistentes usados (${used}) eventId=${eventId}`);
        const e = new Error(`Capacidad no puede ser menor a ${used}`); e.status=409; throw e;
      }
    }

    const updated = await this.eventsRepository.updateBydId(eventId, userId, upd);
    if (!updated) {
      logger.warn(`[EventsService] updateEvent - No autorizado o no existe eventId=${eventId} userId=${userId}`);
      const err = new Error('Evento no encontrado o no autorizado');
      err.status = 404; throw err;
    }

    logger.info(`[EventsService] updateEvent - Actualizado eventId=${eventId}`);
    return {
      id: updated._id,
      name: updated.name,
      date: updated.date,
      location: updated.location,
      capacity: updated.capacity,
      attendeesCount: updated.attendees?.length ?? 0,
    };
  }
}
