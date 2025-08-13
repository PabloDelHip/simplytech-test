import Joi from 'joi';
import { objectIdSchema } from '../../../support/helpers/validators/objectid.validator.js';

  

const baseEventFields = {
  name: Joi.string().min(1).max(120).trim(),
  date: Joi.date().iso(),
  location: Joi.string().min(1).max(200).trim(),
  capacity: Joi.number().integer().min(1).max(100000),
};

export const createEventSchema = Joi.object({
  name: baseEventFields.name.required(),
  date: baseEventFields.date.required(),
  location: baseEventFields.location.required(),
  capacity: baseEventFields.capacity.required(),
}).unknown(true);

export const eventIdParamSchema = Joi.object({
  id: objectIdSchema.required(),
});