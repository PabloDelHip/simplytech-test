import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),

  MONGO_URI: Joi.string()
    .uri({ scheme: ['mongodb'] })
    .required()
    .messages({ 'any.required': 'MONGO_URI es requerido y debe ser un URI válido' }),

  MONGO_DB_NAME: Joi.string().trim().min(1).required()
    .messages({ 'any.required': 'MONGO_DB_NAME es requerido' }),

  JWT_SECRET: Joi.string().min(32).required()
    .messages({ 'string.min': 'JWT_SECRET debe tener al menos 32 caracteres' }),

  JWT_EXPIRES_IN: Joi.string().pattern(/^\d+[smhd]$/).required()
    .messages({
      'string.pattern.base': 'JWT_EXPIRES_IN debe tener formato como 10s, 5m, 6h, 7d'
    }),

  PORT: Joi.number().integer().min(0).default(3000),

}).unknown(true);

const { value, error } = schema.prefs({ convert: true }).validate(process.env);

if (error) {
  console.error('Configuración inválida:\n', error.details.map(d => `- ${d.message}`).join('\n'));
  process.exit(1);
}

const env = Object.freeze({
  NODE_ENV: value.NODE_ENV,
  PORT: value.PORT,
  MONGO_URI: value.MONGO_URI,
  MONGO_DB_NAME: value.MONGO_DB_NAME,
  JWT_SECRET: value.JWT_SECRET,
  JWT_EXPIRES_IN: value.JWT_EXPIRES_IN,
  SKIP_AUTH: value.SKIP_AUTH,
});

export default env;
