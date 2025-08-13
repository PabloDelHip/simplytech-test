import UsersRepository from '../users/users.repository.js';
import AuthController from './auth.controller.js';
import AuthService from './auth.service.js';

const authService = new AuthService(new UsersRepository);

export const AuthControllerInstance = new AuthController(authService);
