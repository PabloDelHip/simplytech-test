import { RequestValidation, ObjectParser } from '../../support/index.js';
import { loginSchema } from './dto/index.js';
import logger from '../../config/logger.js';

const { fullValidate } = RequestValidation;

export default class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  async login(body) {
    const { email, password } = fullValidate(loginSchema, body);
    logger.info(`[AuthController] login - Intento de login para email: ${email}`);

    try {
      const result = await this.authService.login({ email, password });
      logger.info(`[AuthController] login - Login exitoso para email: ${email}`);
      return ObjectParser.responseOf(200, result);
    } catch (err) {
      logger.error(`[AuthController] login - Error en login para email: ${email} - ${err.message}`);
      throw err;
    }
  }

  async me(userId) {
    logger.info(`[AuthController] me - Consultando datos del usuario con id: ${userId}`);
    try {
      const result = await this.authService.me(userId);
      logger.info(`[AuthController] me - Datos del usuario obtenidos: id=${userId}`);
      return ObjectParser.responseOf(200, result);
    } catch (err) {
      logger.error(`[AuthController] me - Error obteniendo datos de usuario id=${userId} - ${err.message}`);
      throw err;
    }
  }
}
