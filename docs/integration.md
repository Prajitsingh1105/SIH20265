# DEPOSIT-TRACK: Integration Layer & Adapter Pattern Specification

This document outlines how DEPOSIT-TRACK integrates with external banking networks, AICTE e-Governance backends, and communication gateways using the **Adapter Pattern**.

---

## 1. Adapter Pattern Architecture

To eliminate vendor lock-in and enable zero-downtime transitions between mock test environments and production government infrastructure, all external boundaries communicate through strongly typed TypeScript interfaces.

```
                   ┌──────────────────────────────────┐
                   │    Core Business Logic Layer     │
                   └─────────────────┬────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
           ▼                         ▼                         ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│BankVerificationAdapter│  │  AicteSystemAdapter  │  │  NotificationAdapter │
└──────────┬───────────┘  └──────────┬───────────┘  └──────────┬───────────┘
           │                         │                         │
     ┌─────┴─────┐             ┌─────┴─────┐             ┌─────┴─────┐
     ▼           ▼             ▼           ▼             ▼           ▼
[Mock CBS]  [Live SFMS]   [Mock ERP]  [Live AICTE]  [Mailpit]   [NIC SMS]
```

---

## 2. Bank Verification Gateway (`BankVerificationAdapter`)

### Interface Definition
```typescript
export interface BankVerificationAdapter {
  queryFdrLedger(query: {
    fdrNumber: string;
    bankCode: string;
    ifscPrefix: string;
    claimedAmount: number;
    accountNumber?: string;
  }): Promise<{
    fdrNumber: string;
    bankName: string;
    branch: string;
    amount: number;
    issueDate: Date;
    maturityDate: Date;
    lienMarkedInFavorOf: string;
    isLienActive: boolean;
    cbsReferenceId: string;
  }>;
}
```

### Production Switch
In `.env`:
- `BANK_CBS_MODE=mock`: Returns simulated responses from SBI, PNB, HDFC, Canara, and BoB (including intentional demo discrepancy scenarios).
- `BANK_CBS_MODE=live`: Directs REST / SFMS / NPCI queries to the designated bank API gateway endpoints.

---

## 3. AICTE ERP System Adapter (`AicteSystemAdapter`)

### Capabilities:
1. **AISHE Code Verification:** Validates institutional AISHE codes directly against the Ministry of Education master database.
2. **Approval Condition Verification:** Validates prescribed minimum security deposit amounts based on institutional category (Engineering, Management, Pharmacy, Architecture, Polytechnic).
3. **Course Closure Synchronization:** Confirms that all graduation batches have graduated prior to permitting final FDR release.

---

## 4. Communication Gateway Adapter (`NotificationAdapter`)

### Multi-Channel Strategy:
1. **SMTP Email:** In development, routes through Mailpit (`localhost:1025` SMTP, `localhost:8025` web UI). In production, points to National Informatics Centre (NIC) email relay.
2. **SMS Gateway:** Logs every dispatched SMS to the PostgreSQL `SmsOutbox` table (viewable at `/sms-outbox`) and transmits via CDAC / NIC SMS gateway.
