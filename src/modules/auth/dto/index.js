import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().required().trim(),
  password: Joi.string().min(8).max(128).required(),
});
