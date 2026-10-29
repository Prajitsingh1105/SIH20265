# DEPOSIT-TRACK: 12-Step Presentation Script & Walkthrough Guide
**Smart India Hackathon 2026 | Team StrataXX | Problem Statement: SIH26265**

*Note: The built-in "▶ Demo Guide" floating button in the bottom-right corner of the application provides an interactive checklist with 1-click role login and direct navigation shortcuts for each of the steps below.*

---

### Step 1: Portal Landing, GIGW 3.0 Header & 2FA Login
- **Target Role:** Institution User (`institution1`)
- **Click Path:** 
  1. Open `http://localhost:5173/`.
  2. Toggle Language to **हिन्दी** in the top utility bar and notice full navigation translation. Switch back to **English**.
  3. Click **A+** to scale font size; toggle **High Contrast Mode** on and off.
  4. Click **Access Portal (Login)**.
  5. Click **Sunrise Institute of Technology** on the Demo Access Card (or enter username `institution1`, password `demo123`).
  6. Observe 2FA OTP prompt with fixed demo code `123456` and masked mobile number. Click **Verify & Enter Portal**.
- **Talking Point:** *"DEPOSIT-TRACK adheres strictly to GIGW 3.0 government accessibility standards with bilingual English/Hindi support, WCAG AA contrast, and enterprise two-factor authentication."*

---

### Step 2: FDR Submission with PaddleOCR Auto-Extraction
- **Target Role:** Institution User (`institution1`)
- **Click Path:**
  1. Navigate to **New FDR Submission** in the left sidebar.
  2. Click the upload zone and select `/docs/sample-data/sample_fdr_receipt.txt` (or any image/PDF).
  3. Watch the OCR engine parse receipt attributes in milliseconds and advance to Step 2 with an **OCR Confidence: 94%** indicator.
  4. Review the auto-populated FDR Number (`FDR-SBI-2024-8842`), Bank (`State Bank of India`), Branch, Amount (`₹15,00,000`), Issue & Maturity Dates.
  5. Click **Proceed to Supporting Documents**, attach the AICTE Lien Pledge letter, check the legal declaration, and click **Submit FDR to AICTE Portal**.
- **Talking Point:** *"Our PaddleOCR pipeline automates error-prone manual data entry, extracting FDR numbers, tenure, and amounts while enforcing AICTE prescribed minimum norm checks synchronously on upload."*

---

### Step 3: Automated Discrepancy Detection in Action
- **Target Role:** Institution User (`institution1`)
- **Click Path:**
  1. Navigate to **FDR Repository**.
  2. Look at record `FDR-SBI-2024-DUP99`.
  3. Notice the 🔴 **Discrepancy Flagged** badge.
  4. Open Details and switch to the **Discrepancies** tab to see: *"DUPLICATE_FDR: FDR number already exists under Bharat College of Engineering"*.
- **Talking Point:** *"Our smart discrepancy engine immediately catches duplicate deposit numbers across India, date inversions, and norm violations before funds can be encumbered fraudulently."*

---

### Step 4: AICTE Scrutiny Officer Inspection
- **Target Role:** Scrutiny Officer (`officer1`)
- **Click Path:**
  1. Open the floating **Demo Guide** drawer and click **Login as Officer** (or switch to `officer1`).
  2. On the Dashboard, review the **Instruments Requiring Immediate Action** list.
  3. Open `FDR-SBI-2024-DUP99`, review the duplicate flag, and inspect the Scrutiny Notes section.
- **Talking Point:** *"AICTE officers receive a prioritized scrutiny cockpit that highlights non-compliant instruments and records official observations with full cryptographic traceability."*

---

### Step 5: Two-Tier Bank CBS Verification Loop (Mismatch & Resolution)
- **Target Role:** Scrutiny Officer (`officer1`) & Institution User (`institution1`)
- **Click Path:**
  1. In the FDR Repository, open `FDR-HDFC-9921`.
  2. Click the **Bank CBS Verification** tab to inspect the side-by-side reconciliation.
  3. Show the highlighted red mismatch: Claimed `₹25,00,000` vs Bank CBS Ledger `₹20,00,000`. The trust badge is 🔴 **Discrepancy Flagged** and status is `Resubmission Required`.
  4. Switch back to **Institution User** via Demo Guide.
  5. Click **Correct & Resubmit**, enter corrected amount `2000000`, and submit.
  6. Switch to **Scrutiny Officer**, click **Trigger Bank CBS Verification**.
  7. Notice the verification badge turns 🟢 **Confirmed by Bank**!
- **Talking Point:** *"Our Two-Tier Trust Layer separates claimed submissions from verified bank records. Automated CBS reconciliation catches discrepancies early, turning badges from amber to green only upon bank ledger confirmation."*

---

### Step 6: Digital Document Vault & Version History
- **Target Role:** Institution User (`institution1`)
- **Click Path:**
  1. Open any FDR detail page and select the **Digital Vault** tab.
  2. Point out the **AES-256-GCM** encryption indicator and SHA-256 file checksums.
  3. Click **Decrypt & Download** to demonstrate on-the-fly decryption and access logging.
  4. Click **Upload Version (v2)**, attach an updated endorsement file with change reason *"Bank stamped endorsement"*, and watch the version history update.
- **Talking Point:** *"All deposit certificates are encrypted at the application layer before cloud storage. Every version is preserved immutably with complete audit access logs."*

---

### Step 7: Automated Lifecycle Engine & Time Travel (+60 Days)
- **Target Role:** System Admin (`admin1`)
- **Click Path:**
  1. Login as **System Admin**. Navigate to **System Settings**.
  2. Locate the **Demo Time Travel (Lifecycle Simulator)** panel.
  3. Click **Jump +60 Days**.
  4. Notice the persistent amber banner: *"Simulated System Date is DD MMM YYYY (+60 Days Shifted)"*.
  5. Point out the instant lifecycle scan output: 36 FDRs scanned, pre-maturity reminders triggered for instruments maturing in 90 and 60 days.
  6. Open the notification bell to show the newly generated maturity reminders, and inspect the **SMS Outbox** page.
  7. Advance the clock past maturity to demonstrate automated overdue flagging and senior officer escalation.
- **Talking Point:** *"The Automated Lifecycle Engine guarantees zero missed maturities through proactive 90/60/30/7-day alerts and automated escalations. The Demo Clock proves live system behavior across future dates in seconds."*

---

### Step 8: Linked Renewal Chain
- **Target Role:** Institution User (`institution1`)
- **Click Path:**
  1. Login as **Institution User**. Locate matured instrument `FDR-CANARA-2021-OLD1`.
  2. Open Details, click **Submit Renewal FDR**, and submit new instrument `FDR-CANARA-2024-REN1`.
  3. Switch to the **Timeline & Renewals** tab to show the permanent visual link connecting the old FDR to the active renewal.
- **Talking Point:** *"Deposit renewals maintain a continuous parent-child lineage, preserving institutional compliance history over decades."*

---

### Step 9: Multi-Stage Release Workflow & Official QR Order
- **Target Role:** Institution (`institution1`), Officer (`officer1`), Competent Authority (`authority1`)
- **Click Path:**
  1. Navigate to **Release / Refund**. Open active request `REL-2026-001`.
  2. Show the automated **Prescribed Eligibility Checklist** (Bank Confirmed ✓, No Discrepancies ✓, Lock-in Satisfied ✓).
  3. Log in as **Scrutiny Officer**, click **Scrutinize & Forward Request** with recommendation to approve.
  4. Log in as **Competent Authority**, click **Approve & Sign Release Order**.
  5. The request moves to `APPROVED`, instrument becomes `RELEASED`, and a button appears: **Download Release Order PDF (QR Verified)**.
  6. Click to view/download the official AICTE sanction order with national emblem styling, digital signature box, and scannable verification QR code!
- **Talking Point:** *"Release requests move through a transparent 4-stage pipeline with automated eligibility checks and instant generation of tamper-proof, QR-coded sanction orders."*

---

### Step 10: Executive Dashboards & Measured KPIs
- **Target Role:** Scrutiny Officer (`officer1`)
- **Click Path:**
  1. Navigate to **Dashboard**.
  2. Review the **Measurable Outcomes & SIH Impact Index** banner:
     - Average turnaround: **1.8 Days** (vs 24 days manual)
     - Bank Confirmed Ratio: **88%**
     - Missed Deadlines: **0**
     - Estimated Hours Saved: **~320 Hours**
  3. Review the interactive Recharts visualizations: Trust distribution donut, Bank-wise deposit volume, and Monthly maturity schedule.
- **Talking Point:** *"DEPOSIT-TRACK transforms scattered spreadsheets into an executive decision dashboard with quantified KPIs matching our presentation benchmarks."*

---

### Step 11: Immutable SHA-256 Audit Integrity & Fraud Simulation
- **Target Role:** System Admin (`admin1`)
- **Click Path:**
  1. Navigate to **Audit Trail**.
  2. Click **Verify Audit Integrity**. Notice the green confirmation: *"Audit chain fully intact. All sequential records cryptographically verified."*
  3. Click **Simulate DB Tampering** to execute an unauthorized update directly in the database.
  4. Click **Verify Audit Integrity** again: Notice the instant red warning: *"🚨 Tampering Detected at Record #3! Calculated hash does not match stored hash."*
  5. Click **Repair Chain** to restore the cryptographic chain to green.
- **Talking Point:** *"Our SHA-256 hash-chained ledger provides tamper-evident auditability. Any rogue insider modification in the database is detected mathematically with pinpoint record accuracy."*

---

### Step 12: Integrations Hub & Live Connection Handshake
- **Target Role:** System Admin (`admin1`)
- **Click Path:**
  1. Navigate to **Integrations Hub**.
  2. Show the registered gateways: Bank CBS Gateway, AICTE e-Gov Systems, Mailpit SMTP, SMS Gateway, and PaddleOCR Engine.
  3. Click **Test Connection** on the Bank CBS Gateway and observe the real-time latency ping (42ms) and handshake verification.
- **Talking Point:** *"Built on the Adapter Pattern, DEPOSIT-TRACK connects cleanly to India's banking networks, AICTE systems, and national telephony infrastructure with zero architectural friction."*
