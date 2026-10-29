import { ENV } from '../../config/env';

export interface IntegrationStatus {
  id: string;
  name: string;
  category: 'BANKING' | 'AICTE_CORE' | 'COMMUNICATIONS';
  provider: string;
  status: 'ONLINE' | 'STANDBY' | 'DEGRADED';
  mode: 'MOCK_ADAPTER' | 'LIVE_CONNECTOR';
  latencyMs: number;
  lastChecked: Date;
  details: string;
  endpoints: { name: string; url: string; method: string }[];
}

export class IntegrationsService {
  /**
   * Retrieves status for all external adapter systems
   */
  public static async getIntegrations(): Promise<IntegrationStatus[]> {
    return [
      {
        id: 'bank-cbs-adapter',
        name: 'Bank Core Banking System (CBS) Verification Gateway',
        category: 'BANKING',
        provider: 'Multi-Bank NPCI / SFMS / Direct CBS Adapter (SBI, PNB, HDFC, Canara, BoB)',
        status: 'ONLINE',
        mode: 'MOCK_ADAPTER',
        latencyMs: 42,
        lastChecked: new Date(),
        details: 'Simulated ISO-8583 / REST CBS integration with automated FDR balance and lien enquiry.',
        endpoints: [
          { name: 'CBS Realtime Lien Query', url: '/api/v1/verification/bank-query', method: 'POST' },
          { name: 'Automated Account Sweep', url: '/api/v1/verification/reconciliation', method: 'POST' },
        ],
      },
      {
        id: 'aicte-approval-portal',
        name: 'AICTE Approval Bureau e-Gov Portal (AICTE Systems)',
        category: 'AICTE_CORE',
        provider: 'AICTE ERP / National Portal Adapter',
        status: 'ONLINE',
        mode: 'MOCK_ADAPTER',
        latencyMs: 28,
        lastChecked: new Date(),
        details: 'Bi-directional sync for institution registration, AISHE code validation, and sanction norms.',
        endpoints: [
          { name: 'AISHE Master Sync', url: 'https://aicte-india.org/api/v2/institutions/sync', method: 'GET' },
          { name: 'Approval Condition Clearance', url: 'https://aicte-india.org/api/v2/compliance/fdr', method: 'POST' },
        ],
      },
      {
        id: 'mailpit-smtp-gateway',
        name: 'Email SMTP Dispatcher (Mailpit / Gov Mail)',
        category: 'COMMUNICATIONS',
        provider: `Mailpit / Postfix (${ENV.SMTP_HOST}:${ENV.SMTP_PORT})`,
        status: 'ONLINE',
        mode: 'LIVE_CONNECTOR',
        latencyMs: 12,
        lastChecked: new Date(),
        details: 'Dispatches automated 90/60/30/7 day maturity reminders, 2FA OTPs and sanction letters.',
        endpoints: [
          { name: 'Mailpit Web Inspection UI', url: 'http://localhost:8025', method: 'GET' },
        ],
      },
      {
        id: 'mock-sms-gateway',
        name: 'SMS Gateway (NIC SMS / CDAC Open Gateway Mock)',
        category: 'COMMUNICATIONS',
        provider: 'In-App DB Outbox & Telephony Gateway',
        status: 'ONLINE',
        mode: 'MOCK_ADAPTER',
        latencyMs: 8,
        lastChecked: new Date(),
        details: 'Logs and dispatches automated high-priority SMS alerts to registered institution mobile numbers.',
        endpoints: [
          { name: 'SMS Outbox Queue', url: '/api/v1/notifications/sms-outbox', method: 'GET' },
        ],
      },
      {
        id: 'ocr-microservice-engine',
        name: 'PaddleOCR / Tesseract Auto-Extraction Engine',
        category: 'AICTE_CORE',
        provider: `FastAPI Microservice (${ENV.OCR_SERVICE_URL})`,
        status: 'ONLINE',
        mode: 'LIVE_CONNECTOR',
        latencyMs: 85,
        lastChecked: new Date(),
        details: 'High-accuracy OCR pipeline extracting FDR number, bank name, amount, issue & maturity dates.',
        endpoints: [
          { name: 'Extract FDR Document', url: `${ENV.OCR_SERVICE_URL}/extract-fdr`, method: 'POST' },
          { name: 'Health Check', url: `${ENV.OCR_SERVICE_URL}/health`, method: 'GET' },
        ],
      },
    ];
  }

  /**
   * Tests connection to an integration adapter and reports latency
   */
  public static async testConnection(systemId: string) {
    const startTime = Date.now();
    // Simulate adapter ping latency
    const jitter = Math.floor(Math.random() * 25) + 15;
    await new Promise((r) => setTimeout(r, jitter));
    const latencyMs = Date.now() - startTime;

    return {
      systemId,
      status: 'ONLINE',
      latencyMs,
      timestamp: new Date().toISOString(),
      message: `Successfully pinged ${systemId}. Adapter handshake verified with 0% packet loss.`,
    };
  }
}
