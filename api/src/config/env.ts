import dotenv from 'dotenv';
import path from 'path';

// Load .env from workspace root or api folder
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DEMO_MODE: process.env.DEMO_MODE !== 'false',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || 'sih2026_super_secure_jwt_secret_strataxx_ai_fdr_portal_987654321',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'sih2026_super_secure_jwt_refresh_secret_strataxx_ai_fdr_portal_123456789',
  FILE_ENCRYPTION_KEY: process.env.FILE_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || 'localhost',
  MINIO_PORT: parseInt(process.env.MINIO_PORT || '9000', 10),
  MINIO_USE_SSL: process.env.MINIO_USE_SSL === 'true',
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY || 'minioadmin',
  MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME || 'fdr-vault',
  SMTP_HOST: process.env.SMTP_HOST || 'localhost',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '1025', 10),
  SMTP_FROM: process.env.SMTP_FROM || 'DEPOSIT-TRACK AICTE <notifications@deposittrack.gov.in>',
  OCR_SERVICE_URL: process.env.OCR_SERVICE_URL || 'http://localhost:8000',
};
