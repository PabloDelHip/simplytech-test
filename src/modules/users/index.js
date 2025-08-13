import UsersRepository from './users.repository.js';
import EventsRepository from '../events/events.repository.js';
import UsersController from './users.controller.js';
import UsersService from './users.service.js';

const usersService = new UsersService(new UsersRepository, new EventsRepository);

export const UsersControllerInstance = new UsersController(usersService);
