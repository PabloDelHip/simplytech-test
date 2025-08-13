import bcrypt from 'bcryptjs';
import logger from '../../config/logger.js';

export default class UsersService {
  constructor(UsersRepository, EventsRepository) {
    this.usersRepository = UsersRepository;
    this.eventsRepository = EventsRepository;
  }

  async getEvents(userId) {
    logger.debug(`[UsersService] getEvents - userId=${userId}`);
    return this.eventsRepository.getEvents(userId);
  }

  async registerUser({ name, email, password }) {
    const normalizedEmail = String(email).trim().toLowerCase();
    logger.debug(`[UsersService] registerUser - email=${normalizedEmail}`);

    const exists = await this.usersRepository.findOne({ email: normalizedEmail });
    if (exists) {
      logger.warn(`[UsersService] registerUser - Email duplicado: ${normalizedEmail}`);
      const err = new Error('El email ya está registrado');
      err.status = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const created = await this.usersRepository.create({
        name: String(name).trim(),
        email: normalizedEmail,
        password: passwordHash,
        createdAt: new Date(),
      });

      logger.info(`[UsersService] registerUser - Usuario creado id=${created._id}`);
      return { id: created._id, name: created.name, email: created.email };
    } catch (e) {
      if (e && e.code === 11000) {
        logger.warn(`[UsersService] registerUser - Índice único violado (email=${normalizedEmail})`);
        const err = new Error('El email ya está registrado');
        err.status = 409;
        throw err;
      }
      logger.error(`[UsersService] registerUser - Error inesperado: ${e.message}`);
      throw e;
    }
  }

  async updateProfile(userId, { name, email, password }) {
    logger.debug(`[UsersService] updateProfile - userId=${userId}`);
    const patch = {};
    if (name) patch.name = String(name).trim();
    if (email) patch.email = String(email).trim().toLowerCase();
    if (password) patch.password = await bcrypt.hash(password, 10);

    const updated = await this.usersRepository.updateById(userId, patch);
    if (!updated) {
      logger.warn(`[UsersService] updateProfile - Usuario no encontrado id=${userId}`);
      const err = new Error('Usuario no encontrado'); err.status = 404; throw err;
    }

    logger.info(`[UsersService] updateProfile - Perfil actualizado id=${userId}`);
    return { id: updated._id, name: updated.name, email: updated.email };
  }

  async getRegisteredEvents(userId) {
    logger.debug(`[UsersService] getRegisteredEvents - userId=${userId}`);
    const events = await this.eventsRepository.findMany(
      { attendees: this.eventsRepository.toObjectId(userId) },
      {
        sort: { date: 1 },
        projection: { name: 1, date: 1, location: 1, capacity: 1, attendees: 1, userId: 1 },
      }
    );

    logger.debug(`[UsersService] getRegisteredEvents - encontrados=${events.length}`);
    return events.map(ev => ({
      id: ev._id,
      name: ev.name,
      date: ev.date,
      location: ev.location,
      capacity: ev.capacity,
      attendeesCount: ev.attendees?.length ?? 0,
      role: 'attendee',
      ownerId: ev.userId,
    }));
  }
}
