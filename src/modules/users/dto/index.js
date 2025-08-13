import Joi from 'joi';

const baseUserFields = {
  name: Joi.string().min(1).max(100).trim(),
  email: Joi.string().email().trim(),
  password: Joi.string().min(8).max(128)
};

export const registerSchema = Joi.object({
  name: baseUserFields.name.required(),
  email: baseUserFields.email.required(),
  password: baseUserFields.password.required()
});

export const updateProfileSchema = Joi.object({
  name: baseUserFields.name.optional(),
  email: baseUserFields.email.optional(),
  password: baseUserFields.password.optional()
}).min(1);
