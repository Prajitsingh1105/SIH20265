# DEPOSIT-TRACK: Security Deposit & FDR Management Portal
**Smart India Hackathon 2026 | Problem Statement: SIH26265 | Team StrataXX**
*Theme: Smart Automation | Category: Software | AICTE Context*
*Tagline: "One portal for every deposit, from submission to release."*

---

## 🏛️ Executive Summary

DEPOSIT-TRACK is an enterprise-grade digital portal engineered for the All India Council for Technical Education (AICTE) to centralize, verify, monitor, and streamline the lifecycle of institutional Fixed Deposit Receipts (FDRs) and security deposits. 

### Core Innovations & Key Differentiators
1. **Verified vs Claimed Trust Layer:** Clearly distinguishes between institution-claimed FDR submissions (🟠) and bank Core Banking System (CBS) confirmed records (🟢) with automated discrepancy detection.
2. **Zero-Miss Maturity Monitoring Engine:** Proactive 90, 60, 30, and 7-day automated reminders across Email (Mailpit), in-app notification bell, and SMS Outbox, with automated post-maturity escalations to senior officers.
3. **Demo Time Travel Clock:** Integrated administrative capability to shift the portal reference date forward (+30d, +60d, +90d) to demonstrate real-time alert triggers and escalations live during jury evaluation.
4. **Digital Document Vault:** Application-layer AES-256-GCM encrypted storage with multi-version history (`v1`, `v2`...) and tamper-proof access logging.
5. **PaddleOCR Extraction:** Neural document extraction microservice that extracts receipt numbers, banks, amounts, and validity dates from scanned deposit certificates.
6. **Immutable Cryptographic Audit Trail:** Every transaction is linked into a sequential SHA-256 hash chain with built-in mathematical integrity verification, fraud simulation, and self-repair.
7. **End-to-End Release & Refund Stepper:** Multi-stage workflow featuring automated eligibility checking, officer scrutiny, competent authority approval, and instant generation of tamper-proof, QR-coded sanction order PDFs.
8. **Modern GIGW 3.0 Styling:** Compliant with Government of India Web Guidelines featuring bilingual English/Hindi localization, WCAG 2.1 AA accessibility controls (text scaling, high-contrast mode), and national emblem branding.

---

## 🚀 Quick Start & Deployment

### Option A: Complete Docker Compose (Production Stack)
Start all 7 microservices (PostgreSQL, Redis, MinIO S3, Mailpit, Express API, PaddleOCR Service, React Web) with a single command:

```bash
docker compose up --build
```

### Option B: Local Development Setup
Both the Express API and Vite React frontend can run natively with zero container dependencies:

1. **Install Dependencies:**
   ```bash
   cd api && npm install
   cd ../web && npm install
   ```

2. **Database Initialization & Seeding:**
   ```bash
   cd api
   npx prisma generate
   npx prisma db push
   npx tsx src/prisma/seed.ts
   ```

3. **Start Servers:**
   - **Terminal 1 (Backend API):**
     ```bash
     cd api
     npm run dev
     ```
   - **Terminal 2 (Frontend Web):**
     ```bash
     cd web
     npm run dev
     ```

---

## 🌐 Service URLs & Access Points

| Service | Local URL | Description |
| :--- | :--- | :--- |
| **Web Portal** | `http://localhost:5173` | GIGW 3.0 React Portal (Landing, Vault, Workflows) |
| **REST API Server** | `http://localhost:5000/api/v1` | Versioned Express REST API |
| **Interactive API Docs** | `http://localhost:5000/api/docs` | OpenAPI / Swagger Interface |
| **Mailpit Web Inspector** | `http://localhost:8025` | In-Browser SMTP Email Viewer |
| **MinIO Storage Console** | `http://localhost:9001` | S3-Compatible Encrypted Object Vault |
| **OCR Microservice** | `http://localhost:8000` | FastAPI Neural Text Extraction Engine |

---

## 🔑 Demo Access Credentials

The portal features an integrated **Demo Access Card** on the login screen and a floating **▶ Demo Guide** drawer in the bottom right corner with 1-click role switching:

| Persona / Role | Username | Password | Default 2FA OTP | Organization Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Institution User 1** | `institution1` | `demo123` | `123456` | Sunrise Institute of Technology (`INST-1001`) |
| **Institution User 2** | `institution2` | `demo123` | `123456` | Bharat College of Engineering (`INST-1002`) |
| **AICTE Scrutiny Officer** | `officer1` | `demo123` | `123456` | Western & Southern Scrutiny Bureau |
| **Competent Authority** | `authority1` | `demo123` | `123456` | AICTE Executive Approval Council |
| **System Administrator** | `admin1` | `demo123` | `123456` | National IT & Audit Administrator |

---

## 🛡️ Security & Compliance Standards

- **Authentication & RBAC:** JWT Bearer tokens with 12-hour session lifespans, cryptographic refresh tokens, and strict multi-tenant institution isolation.
- **Two-Factor Authentication (2FA):** Mandatory one-time passcodes dispatched via email and SMS outbox. In demo mode (`DEMO_MODE=true`), fixed OTP `123456` is also accepted.
- **Encryption at Rest:** Application-layer AES-256-GCM symmetric encryption for all vaulted deposit scans and documents before transmission to object storage.
- **TLS in Transit:** Production configurations terminate TLS 1.3 with HSTS, HTTPOnly SameSite cookies, and OWASP secure headers enforced by Helmet.
- **Hash-Chained Audit Logs:** Each audit row stores `currHash = SHA256(Record + prevHash)`. Unauthorized direct database edits break the mathematical chain and trigger instant red alerts in the Audit Verifier.

---

## 📂 Project Repository Structure

```
d:/SIH265/
├── docker-compose.yml       # 7-container Docker orchestration
├── .env.example             # Documented environment template
├── README.md                # System documentation
├── api/                     # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/          # Prisma DB, Nodemailer, Environment config
│   │   ├── middleware/      # JWT Auth, RBAC Tenancy, Audit Logger
│   │   ├── modules/         # FDRs, Vault, CBS Verification, Release, Reports
│   │   ├── prisma/          # schema.prisma & idempotent seed.ts (41 FDRs)
│   │   ├── tests/           # Vitest Automated Test Suite
│   │   └── utils/           # AES-256, PDFKit QR Order Generator
├── web/                     # React + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/      # GIGW 3.0 Header, Sidebar, Badges, Demo Guide
│   │   ├── context/         # Auth, Demo Time Travel, Bilingual i18n
│   │   ├── pages/           # Landing, Login, Dashboard, Repository, Release
│   │   └── services/        # Centralized REST API Client
├── ocr-service/             # FastAPI + PaddleOCR Microservice
└── docs/
    ├── architecture.md      # Mermaid Architectural Specification
    ├── integration.md       # Adapter Pattern & CBS Gateway Spec
    ├── DEMO_SCRIPT.md       # 12-Step Presentation Script & Talking Points
    └── sample-data/         # Simulated FDR Receipts & Bank Letters
```

---

## 🧪 Automated Test Suite

Run the backend test suite covering RBAC isolation, discrepancy engine rules, hash-chain verification, and lifecycle time-travel:

```bash
cd api
npm test
```
*Result: 8/8 tests passing.*

---
**Developed by Team StrataXX for Smart India Hackathon 2026**
