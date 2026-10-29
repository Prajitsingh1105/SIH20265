import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { ENV } from './config/env';
import { LifecycleService } from './modules/lifecycle/lifecycle.service';

// Module route imports
import authRoutes from './modules/auth/auth.routes';
import fdrRoutes from './modules/fdrs/fdr.routes';
import documentRoutes from './modules/documents/document.routes';
import verificationRoutes from './modules/verification/verification.routes';
import discrepancyRoutes from './modules/discrepancies/discrepancy.routes';
import releaseRoutes from './modules/release/release.routes';
import lifecycleRoutes from './modules/lifecycle/lifecycle.routes';
import reportsRoutes from './modules/reports/reports.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import integrationRoutes from './modules/integrations/integrations.routes';
import auditRoutes from './modules/audit/audit.routes';
import adminRoutes from './modules/admin/admin.routes';
import ocrRoutes from './modules/ocr/ocr.routes';

const app = express();

// 1. Security Middleware (OWASP Top 10 Hygiene)
app.use(
  helmet({
    contentSecurityPolicy: false, // For flexible demo preview
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', ENV.FRONTEND_URL],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Generous for demo exploration
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// 2. Health & Root API Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    app: 'DEPOSIT-TRACK API',
    version: '1.0.0',
    institution: 'All India Council for Technical Education (AICTE)',
    team: 'StrataXX',
    demoMode: ENV.DEMO_MODE,
    timestamp: new Date().toISOString(),
  });
});

// Interactive API Documentation / OpenAPI Spec at /api/docs
app.get('/api/docs', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'DEPOSIT-TRACK AICTE Security Deposit & FDR Management Portal REST API',
      version: '1.0.0',
      description: 'Official API documentation for SIH 2026 Problem Statement SIH26265 (Team StrataXX)',
    },
    servers: [{ url: `http://localhost:${ENV.PORT}/api/v1` }],
    modules: [
      'Auth (/api/v1/auth)',
      'FDR Central Repository (/api/v1/fdrs)',
      'Digital Document Vault (/api/v1/documents)',
      'Two-Tier Bank Verification (/api/v1/verification)',
      'Smart Discrepancy Detection (/api/v1/discrepancies)',
      'Release & Refund Workflow (/api/v1/release)',
      'Automated Lifecycle Engine & Demo Clock (/api/v1/lifecycle)',
      'Executive Dashboards & Reports (/api/v1/reports)',
      'Notifications & SMS Outbox (/api/v1/notifications)',
      'Integrations Hub (/api/v1/integrations)',
      'Immutable Audit Trail (/api/v1/audit)',
      'Admin & System Config (/api/v1/admin)',
      'PaddleOCR Auto-Extraction (/api/v1/ocr)',
    ],
  });
});

// 3. Mount Versioned REST API Routes
const v1 = express.Router();
v1.use('/auth', authRoutes);
v1.use('/fdrs', fdrRoutes);
v1.use('/documents', documentRoutes);
v1.use('/verification', verificationRoutes);
v1.use('/discrepancies', discrepancyRoutes);
v1.use('/release', releaseRoutes);
v1.use('/lifecycle', lifecycleRoutes);
v1.use('/reports', reportsRoutes);
v1.use('/notifications', notificationRoutes);
v1.use('/integrations', integrationRoutes);
v1.use('/audit', auditRoutes);
v1.use('/admin', adminRoutes);
v1.use('/ocr', ocrRoutes);

app.use('/api/v1', v1);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled API Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// 4. Start Server & Background Scheduler
const PORT = ENV.PORT;
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🏛️  DEPOSIT-TRACK API Server running on port ${PORT}`);
  console.log(`🌐  API URL: http://localhost:${PORT}/api/v1`);
  console.log(`📖  API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`🎯  Demo Mode: ${ENV.DEMO_MODE ? 'ENABLED (with fixed OTP 123456 & 1-click role switcher)' : 'DISABLED'}`);
  console.log(`=======================================================`);

  // Run initial background lifecycle scan
  try {
    const scan = await LifecycleService.runLifecycleScan();
    console.log(`🔄 Initial Lifecycle Scan completed: ${scan.totalScanned} FDRs verified, ${scan.remindersTriggered} reminders sent.`);
  } catch (e) {
    console.warn('Initial lifecycle scan skipped:', (e as Error).message);
  }

  // Schedule recurring scan every 60 minutes
  setInterval(async () => {
    try {
      await LifecycleService.runLifecycleScan();
    } catch (e) {
      console.warn('Periodic lifecycle scan warning:', (e as Error).message);
    }
  }, 60 * 60 * 1000);
});

export default app;
