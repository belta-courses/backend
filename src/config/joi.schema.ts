import Joi from 'joi';

export const joiSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test'),
  HOST_URL: Joi.string().uri(),
  DATABASE_URL: Joi.string().uri().required(),
  S3_REGION: Joi.string().required(),
  S3_ACCESS_KEY_ID: Joi.string().required(),
  S3_SECRET_ACCESS_KEY: Joi.string().required(),
  S3_BUCKET: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  NODEMAILER_USER: Joi.string().email().required(),
  NODEMAILER_PASS: Joi.string().required(),
  NODEMAILER_SENDER_EMAIL: Joi.string().email().required(),
});
