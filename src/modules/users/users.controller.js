import { RequestValidation, ObjectParser } from '../../support/index.js';
import { registerSchema, updateProfileSchema } from './dto/index.js';
import logger from '../../config/logger.js';

const { fullValidate } = RequestValidation;

export default class UsersController {
  constructor(usersService) {
    this.usersService = usersService;
  }

  async getEvents(userId) {
    logger.debug(`[UsersController] getEvents - userId=${userId}`);
    const data = await this.usersService.getEvents(userId);
    return ObjectParser.responseOf(200, data);
  }

  async store(body) {
    logger.debug(`[UsersController] store - Registro de usuario`);
    const values = fullValidate(registerSchema, body);
    const created = await this.usersService.registerUser(values);
    logger.info(`[UsersController] store - Usuario registrado: id=${created?.id || created?._id || '(desconocido)'}`);
    return ObjectParser.responseOf(201, created);
  }

  async update(userId, body) {
    logger.debug(`[UsersController] update - userId=${userId}`);
    const patch = fullValidate(updateProfileSchema, body);
    const updated = await this.usersService.updateProfile(userId, patch);
    logger.info(`[UsersController] update - Perfil actualizado: userId=${userId}`);
    return ObjectParser.responseOf(200, updated);
  }

  async getRegisteredEvents(userId) {
    logger.debug(`[UsersController] getRegisteredEvents - userId=${userId}`);
    const data = await this.usersService.getRegisteredEvents(userId);
    return ObjectParser.responseOf(200, data);
  }
}
