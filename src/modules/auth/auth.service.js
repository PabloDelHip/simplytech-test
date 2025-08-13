import bcrypt from 'bcryptjs';
import { signToken } from '../../support/helpers/jwt.helper.js';
import logger from '../../config/logger.js';

export default class AuthService {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }

  async me(userId) {
    logger.info(`[AuthService] me - Consultando usuario id=${userId}`);
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      logger.error(`[AuthService] me - Usuario no encontrado id=${userId}`);
      const err = new Error('Credenciales inválidas');
      err.status = 404;
      throw err;
    }
    logger.info(`[AuthService] me - Usuario encontrado id=${userId}`);
    return {
      id: user._id,
      name: user.name,
      email: user.email,
    };
  }

  async login({ email, password }) {
    const normEmail = String(email).toLowerCase().trim();
    logger.info(`[AuthService] login - Intento de login email=${normEmail}`);

    const user = await this.usersRepository.findOne({ email: normEmail });
    if (!user) {
      logger.error(`[AuthService] login - Email no registrado email=${normEmail}`);
      const err = new Error('Credenciales inválidas');
      err.status = 401;
      throw err;
    }

    const ok = await bcrypt.compare(password, user.password || '');
    if (!ok) {
      logger.error(`[AuthService] login - Password inválido email=${normEmail}`);
      const err = new Error('Credenciales inválidas');
      err.status = 401;
      throw err;
    }

    const token = signToken({ sub: String(user._id), email: user.email });
    const userDto = { id: user._id, name: user.name, email: user.email };

    logger.info(`[AuthService] login - Login exitoso email=${normEmail} id=${user._id}`);
    return { token, user: userDto };
  }
}
