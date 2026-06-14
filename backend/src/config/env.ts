import dotenv from 'dotenv';

dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  port: parseInt(process.env.PORT ?? '5000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  // Email alerts (Resend). Optional — when absent, alerts are skipped (logged).
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  emailFrom: process.env.EMAIL_FROM ?? 'DevPing Alerts <alerts@devping.io>',
  // Used to build dashboard links inside alert emails.
  appUrl: (process.env.APP_URL ?? process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')[0]
    .trim(),
  // AI anomaly detection (Groq). Optional — analysis is disabled without a key.
  groqApiKey: process.env.GROQ_API_KEY ?? '',
  groqModel: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
  // Redis (BullMQ) — required for the ping queue/worker.
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
};
