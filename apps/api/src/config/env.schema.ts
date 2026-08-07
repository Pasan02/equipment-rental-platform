import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Database
  DATABASE_URL: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().default('super-secret-jwt-key'),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().default('super-secret-refresh-key'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),

  // CORS
  CORS_ORIGINS: Joi.string().default(
    'http://localhost:3000,http://localhost:3001',
  ),

  // Cloudflare R2 / AWS S3 (optional — required in Phase 4)
  STORAGE_ENDPOINT: Joi.string().optional(),
  STORAGE_ACCESS_KEY_ID: Joi.string().optional(),
  STORAGE_SECRET_ACCESS_KEY: Joi.string().optional(),
  STORAGE_BUCKET_NAME: Joi.string().optional(),
  STORAGE_PUBLIC_URL: Joi.string().optional(),

  // SMTP (optional — required in Phase 4)
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().optional(),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  SMTP_FROM: Joi.string().optional(),
});
