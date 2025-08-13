import Joi from 'joi';

export const objectIdSchema = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .message('{#label} debe ser un ObjectId válido');
