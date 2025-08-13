import BaseRepository from '../../infra/db/base.repository.js';
import logger from '../../config/logger.js';

export default class UsersRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  async findByAttendee(userId, options = {}) {
    logger.info(`[UsersRepository] Buscando por attendee: ${userId}`);
    return this.findMany({ attendees: this.toObjectId(userId) }, options);
  }
}
