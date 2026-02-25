import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),

  // Database
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DATABASE_URL: Joi.string().required(),

  // Fraud detection (optional — alert-only, does not block transactions)
  FRAUD_TIME_WINDOW_MINUTES: Joi.number().default(5),
  FRAUD_MAX_TRANSACTIONS: Joi.number().default(3),
  FRAUD_AMOUNT_THRESHOLD: Joi.number().default(1000),
});
