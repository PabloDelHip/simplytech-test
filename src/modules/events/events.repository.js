import BaseRepository from '../../infra/db/base.repository.js';
import logger from '../../config/logger.js';

export default class EventsRepository extends BaseRepository {
  constructor() {
    super('events');
  }

  async findByNameAndDate(name, dateISO) {
    logger.info(`[EventsRepository] Buscando evento por nombre y fecha: name=${name}, dateISO=${dateISO}`);
    return this.findOne({ name: String(name).trim(), dateISO });
  }

  async updateBydId(eventId, userId, data) {
    logger.info(`[EventsRepository] Actualizando evento: eventId=${eventId}, userId=${userId}`);
    const filter = {
      _id: this.toObjectId(eventId),
      userId: this.toObjectId(userId)
    };
    return this.updateOne(filter, data);
  }

  async addAttendeeIfAvailable(eventId, userId) {
    logger.info(`[EventsRepository] Agregando asistente: eventId=${eventId}, userId=${userId}`);
    const filter = {
      _id: this.toObjectId(eventId),
      attendees: { $ne: this.toObjectId(userId) },
      $expr: {
        $lt: [
          { $size: { $ifNull: ['$attendees', []] } },
          '$capacity'
        ]
      }
    };
    const update = { $addToSet: { attendees: this.toObjectId(userId) } };
    return this.col.findOneAndUpdate(filter, update, { returnDocument: 'after' });
  }

  async removeAttendee(eventId, userId) {
    logger.info(`[EventsRepository] Removiendo asistente: eventId=${eventId}, userId=${userId}`);
    const filter = {
      _id: this.toObjectId(eventId),
      attendees: this.toObjectId(userId)
    };
    const update = { $pull: { attendees: this.toObjectId(userId) } };
    return this.col.findOneAndUpdate(filter, update, { returnDocument: 'after' });
  }

  async getEvents(userId) {
    logger.info(`[EventsRepository] Obteniendo eventos para userId=${userId}`);
    const uid = this.toObjectId(userId);

    const pipeline = [
      { $match: { userId: uid } },
      {
        $addFields: {
          attendeesCount: { $size: { $ifNull: ['$attendees', []] } },
          availability: {
            $max: [
              { $subtract: ['$capacity', { $size: { $ifNull: ['$attendees', []] } }] },
              0
            ]
          }
        }
      },
      {
        $project: {
          name: 1, date: 1, location: 1, capacity: 1,
          attendeesCount: 1,
          availability: 1
        }
      },
      { $sort: { date: 1 } }
    ];

    return this.aggregate(pipeline);
  }

  async deleteOwnedById(eventId, userId) {
    logger.info(`[EventsRepository] Eliminando evento: eventId=${eventId}, userId=${userId}`);
    const filter = {
      _id: this.toObjectId(eventId),
      userId: this.toObjectId(userId),
    };
    return this.deleteOne(filter);
  }

  async findAvailable({ from = new Date(), limit = 50, skip = 0 }) {
    logger.info(`[EventsRepository] Buscando eventos disponibles desde=${from.toISOString()}, limit=${limit}, skip=${skip}`);
    const pipeline = [
      { $match: { date: { $gte: from } } },
      {
        $addFields: {
          attendeesCount: { $size: { $ifNull: ['$attendees', []] } },
          availability: {
            $max: [
              { $subtract: ['$capacity', { $size: { $ifNull: ['$attendees', []] } }] },
              0
            ]
          }
        }
      },
      { $match: { availability: { $gte: 1 } } },
      {
        $project: {
          name: 1, date: 1, location: 1, capacity: 1, userId: 1,
          attendeesCount: 1, availability: 1
        }
      },
      { $sort: { date: 1 } },
      { $skip: skip },
      { $limit: limit }
    ];

    return this.aggregate(pipeline);
  }
}
