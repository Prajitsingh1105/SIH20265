import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Helper for SHA-256 hash chaining
function calculateHash(data: string, prevHash: string): string {
  return crypto.createHash('sha256').update(data + prevHash).digest('hex');
}

export async function seedDatabase() {
  console.log('🌱 Starting DEPOSIT-TRACK database seeding...');

  // Clean existing data for idempotency
  await prisma.auditLog.deleteMany();
  await prisma.jobRun.deleteMany();
  await prisma.smsOutbox.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.releaseStage.deleteMany();
  await prisma.releaseRequest.deleteMany();
  await prisma.renewal.deleteMany();
  await prisma.scrutinyNote.deleteMany();
  await prisma.discrepancyFlag.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.documentAccessLog.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.fDRDocument.deleteMany();
  await prisma.fDR.deleteMany();
  await prisma.user.deleteMany();
  await prisma.institution.deleteMany();
  await prisma.bank.deleteMany();
  await prisma.role.deleteMany();
  await prisma.reminderRule.deleteMany();
  await prisma.escalationRule.deleteMany();
  await prisma.systemSetting.deleteMany();

  // 1. Roles
  const roles = await Promise.all([
    prisma.role.create({
      data: {
        name: 'INSTITUTION',
        displayName: 'Institution User',
        description: 'Authorized representative of technical institution / college',
        permissions: JSON.stringify(['fdr:create', 'fdr:view:own', 'fdr:resubmit', 'document:upload', 'release:request']),
      },
    }),
    prisma.role.create({
      data: {
        name: 'SCRUTINY_OFFICER',
        displayName: 'Scrutiny Officer (AICTE)',
        description: 'AICTE officer reviewing FDR submissions, discrepancies & verifications',
        permissions: JSON.stringify(['fdr:view:all', 'fdr:scrutinize', 'discrepancy:override', 'verification:trigger', 'release:scrutinize']),
      },
    }),
    prisma.role.create({
      data: {
        name: 'COMPETENT_AUTHORITY',
        displayName: 'Competent Authority (AICTE)',
        description: 'Executive authority approving or rejecting release/refund requests',
        permissions: JSON.stringify(['fdr:view:all', 'release:approve', 'release:reject', 'reports:view', 'audit:view']),
      },
    }),
    prisma.role.create({
      data: {
        name: 'SYSTEM_ADMIN',
        displayName: 'System Admin',
        description: 'Technical administrator managing configurations, users, and audit logs',
        permissions: JSON.stringify(['*']),
      },
    }),
  ]);

  const roleMap = {
    INSTITUTION: roles[0],
    SCRUTINY_OFFICER: roles[1],
    COMPETENT_AUTHORITY: roles[2],
    SYSTEM_ADMIN: roles[3],
  };

  // 2. Institutions
  const instSunrise = await prisma.institution.create({
    data: {
      code: 'INST-1001',
      name: 'Sunrise Institute of Technology',
      aisheCode: 'C-1001',
      state: 'Maharashtra',
      district: 'Pune',
      address: 'Plot 42, Hinjewadi Phase 1, Pune - 411057',
      contactPerson: 'Dr. Ramesh Sharma',
      email: 'sunrise@deposittrack.gov.in',
      phone: '+91 98230 11223',
      status: 'ACTIVE',
    },
  });

  const instBharat = await prisma.institution.create({
    data: {
      code: 'INST-1002',
      name: 'Bharat College of Engineering',
      aisheCode: 'C-1002',
      state: 'Karnataka',
      district: 'Bengaluru',
      address: 'Outer Ring Road, Bellandur, Bengaluru - 560103',
      contactPerson: 'Prof. Ananya Rao',
      email: 'bharat@deposittrack.gov.in',
      phone: '+91 98450 33445',
      status: 'ACTIVE',
    },
  });

  const instAPJ = await prisma.institution.create({
    data: {
      code: 'INST-1003',
      name: 'APJ Abdul Kalam Technical Academy',
      aisheCode: 'C-1003',
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      address: 'Sector 7, Gomti Nagar Extension, Lucknow - 226010',
      contactPerson: 'Dr. Vikram Singh',
      email: 'apj@deposittrack.gov.in',
      phone: '+91 94150 55667',
      status: 'ACTIVE',
    },
  });

  // 3. Demo Users (password: demo123)
  const passwordHash = await bcrypt.hash('demo123', 10);

  const userInst1 = await prisma.user.create({
    data: {
      username: 'institution1',
      email: 'institution1@deposittrack.gov.in',
      passwordHash,
      fullName: 'Dr. Ramesh Sharma (Principal)',
      phone: '+91 98765 43210',
      designation: 'Principal & Authorized Signatory',
      roleId: roleMap.INSTITUTION.id,
      institutionId: instSunrise.id,
      isTwoFactorEnabled: true,
    },
  });

  const userInst2 = await prisma.user.create({
    data: {
      username: 'institution2',
      email: 'institution2@deposittrack.gov.in',
      passwordHash,
      fullName: 'Prof. Ananya Rao (Director)',
      phone: '+91 98765 43211',
      designation: 'Director',
      roleId: roleMap.INSTITUTION.id,
      institutionId: instBharat.id,
      isTwoFactorEnabled: true,
    },
  });

  const userOfficer = await prisma.user.create({
    data: {
      username: 'officer1',
      email: 'officer1@deposittrack.gov.in',
      passwordHash,
      fullName: 'Rajeev Menon',
      phone: '+91 98765 43220',
      designation: 'Scrutiny Officer - Western & Southern Region',
      roleId: roleMap.SCRUTINY_OFFICER.id,
      isTwoFactorEnabled: true,
    },
  });

  const userAuthority = await prisma.user.create({
    data: {
      username: 'authority1',
      email: 'authority1@deposittrack.gov.in',
      passwordHash,
      fullName: 'Dr. Surendra Mohan',
      phone: '+91 98765 43230',
      designation: 'Adviser & Competent Authority (Finance)',
      roleId: roleMap.COMPETENT_AUTHORITY.id,
      isTwoFactorEnabled: true,
    },
  });

  const userAdmin = await prisma.user.create({
    data: {
      username: 'admin1',
      email: 'admin1@deposittrack.gov.in',
      passwordHash,
      fullName: 'Amitabh Verma',
      phone: '+91 98765 43240',
      designation: 'Director (e-Governance / IT Admin)',
      roleId: roleMap.SYSTEM_ADMIN.id,
      isTwoFactorEnabled: true,
    },
  });

  // 4. Banks
  const bankSBI = await prisma.bank.create({
    data: {
      code: 'SBI',
      name: 'State Bank of India',
      ifscPrefix: 'SBIN000',
      branch: 'Parliament Street Branch, New Delhi',
      contactEmail: 'fdr.verification@sbi.co.in',
      supportPhone: '1800-425-3800',
    },
  });

  const bankPNB = await prisma.bank.create({
    data: {
      code: 'PNB',
      name: 'Punjab National Bank',
      ifscPrefix: 'PUNB000',
      branch: 'Connaught Place Large Corporate Branch, New Delhi',
      contactEmail: 'fdr.desk@pnb.co.in',
      supportPhone: '1800-180-2222',
    },
  });

  const bankHDFC = await prisma.bank.create({
    data: {
      code: 'HDFC',
      name: 'HDFC Bank',
      ifscPrefix: 'HDFC000',
      branch: 'Kasturba Gandhi Marg, New Delhi',
      contactEmail: 'govtfdr@hdfcbank.com',
      supportPhone: '1800-202-6161',
    },
  });

  const bankCANARA = await prisma.bank.create({
    data: {
      code: 'CANARA',
      name: 'Canara Bank',
      ifscPrefix: 'CNRB000',
      branch: 'Ashoka Road Branch, New Delhi',
      contactEmail: 'aicte.cell@canarabank.com',
      supportPhone: '1800-425-0018',
    },
  });

  const bankBOB = await prisma.bank.create({
    data: {
      code: 'BOB',
      name: 'Bank of Baroda',
      ifscPrefix: 'BARB000',
      branch: 'Baroda House Branch, New Delhi',
      contactEmail: 'treasury@bankofbaroda.co.in',
      supportPhone: '1800-258-4455',
    },
  });

  const banks = [bankSBI, bankPNB, bankHDFC, bankCANARA, bankBOB];

  // Helper date generators relative to today (base: October 2026)
  const today = new Date();
  const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);
  const subDays = (d: Date, days: number) => new Date(d.getTime() - days * 86400000);

  // 5. Create ~40 realistic FDRs across all 14 statuses
  console.log('📦 Seeding 40 realistic FDRs across all lifecycle states...');

  // 5.1 Special Demo FDRs for Walkthrough Steps:

  // (a) Duplicate FDR #1 (Sunrise)
  const fdrDup1 = await prisma.fDR.create({
    data: {
      fdrNumber: 'FDR-SBI-2024-DUP99',
      institutionId: instSunrise.id,
      bankId: bankSBI.id,
      branchName: 'Hinjewadi Pune Branch',
      amount: 1500000, // ₹15,00,000
      issueDate: subDays(today, 300),
      maturityDate: addDays(today, 795),
      validityMonths: 36,
      status: 'DISCREPANCY_FLAGGED',
      verificationTier: 'FLAGGED',
      remarks: 'Submitted for MCA Course Extension',
    },
  });

  // (b) Duplicate FDR #2 (Bharat - causes duplicate flag across system!)
  const fdrDup2 = await prisma.fDR.create({
    data: {
      fdrNumber: 'FDR-SBI-2024-DUP99',
      institutionId: instBharat.id,
      bankId: bankSBI.id,
      branchName: 'Indiranagar Bengaluru Branch',
      amount: 1500000,
      issueDate: subDays(today, 10),
      maturityDate: addDays(today, 1085),
      validityMonths: 36,
      status: 'DISCREPANCY_FLAGGED',
      verificationTier: 'FLAGGED',
      remarks: 'Fresh submission for B.Tech CSE intake expansion',
    },
  });

  await prisma.discrepancyFlag.create({
    data: {
      fdrId: fdrDup2.id,
      ruleCode: 'DUPLICATE_FDR',
      severity: 'HIGH',
      message: 'FDR number FDR-SBI-2024-DUP99 already exists under Sunrise Institute of Technology',
      fieldReference: 'fdrNumber',
    },
  });

  // (c) Bank Mismatch FDR (Demo Step 5: Claimed ₹25,00,000 vs Bank ₹20,00,000)
  const fdrMismatch = await prisma.fDR.create({
    data: {
      fdrNumber: 'FDR-HDFC-9921',
      institutionId: instSunrise.id,
      bankId: bankHDFC.id,
      branchName: 'Shivaji Nagar, Pune',
      amount: 2500000, // ₹25,00,000 claimed
      issueDate: subDays(today, 45),
      maturityDate: addDays(today, 1050),
      validityMonths: 36,
      status: 'RESUBMISSION_REQUIRED',
      verificationTier: 'FLAGGED',
      remarks: 'Security deposit for New Pharmacy College',
    },
  });

  await prisma.verification.create({
    data: {
      fdrId: fdrMismatch.id,
      verificationType: 'MOCK_API',
      verifiedById: userOfficer.id,
      bankConfirmedNumber: 'FDR-HDFC-9921',
      bankConfirmedBank: 'HDFC Bank',
      bankConfirmedBranch: 'Shivaji Nagar, Pune',
      bankConfirmedAmount: 2000000, // ₹20,00,000 mismatch!
      bankConfirmedIssueDate: subDays(today, 45),
      bankConfirmedMaturity: addDays(today, 1050),
      isMatched: false,
      mismatchDetails: JSON.stringify({
        field: 'amount',
        claimed: 2500000,
        confirmed: 2000000,
        difference: 500000,
      }),
      remarks: 'Amount mismatch detected during automated CBS verification query.',
    },
  });

  await prisma.discrepancyFlag.create({
    data: {
      fdrId: fdrMismatch.id,
      ruleCode: 'AMOUNT_MISMATCH',
      severity: 'HIGH',
      message: 'Claimed amount ₹25,00,000 does not match Bank Confirmed amount ₹20,00,000',
      fieldReference: 'amount',
    },
  });

  // (d) Missing Documents FDR
  const fdrMissingDoc = await prisma.fDR.create({
    data: {
      fdrNumber: 'FDR-PNB-4412',
      institutionId: instSunrise.id,
      bankId: bankPNB.id,
      branchName: 'FC Road, Pune',
      amount: 1000000, // ₹10,00,000
      issueDate: subDays(today, 20),
      maturityDate: addDays(today, 1075),
      validityMonths: 36,
      status: 'DISCREPANCY_FLAGGED',
      verificationTier: 'FLAGGED',
      remarks: 'Polytechnic Diploma sanction deposit',
    },
  });

  await prisma.discrepancyFlag.create({
    data: {
      fdrId: fdrMissingDoc.id,
      ruleCode: 'MISSING_DOCUMENTS',
      severity: 'MEDIUM',
      message: 'Mandatory AICTE Lien/Pledge declaration letter is missing from submission.',
      fieldReference: 'documents',
    },
  });

  // (e) Renewal Chain FDRs (Old matured -> Renewed linked)
  const fdrOld = await prisma.fDR.create({
    data: {
      fdrNumber: 'FDR-CANARA-2021-OLD1',
      institutionId: instSunrise.id,
      bankId: bankCANARA.id,
      branchName: 'Camp, Pune',
      amount: 3500000, // ₹35,00,000
      issueDate: subDays(today, 1100),
      maturityDate: subDays(today, 5), // Matured 5 days ago
      validityMonths: 36,
      status: 'RENEWED',
      verificationTier: 'CONFIRMED',
      remarks: 'Original security deposit for MBA program (2021-2024)',
    },
  });

  const fdrRenewed = await prisma.fDR.create({
    data: {
      fdrNumber: 'FDR-CANARA-2024-REN1',
      institutionId: instSunrise.id,
      bankId: bankCANARA.id,
      branchName: 'Camp, Pune',
      amount: 3500000,
      issueDate: subDays(today, 4),
      maturityDate: addDays(today, 1091),
      validityMonths: 36,
      status: 'ACTIVE',
      verificationTier: 'CONFIRMED',
      parentFdrId: fdrOld.id,
      isRenewal: true,
      remarks: 'Renewal of FDR-CANARA-2021-OLD1 for subsequent 3 years',
    },
  });

  await prisma.renewal.create({
    data: {
      previousFdrId: fdrOld.id,
      newFdrId: fdrRenewed.id,
      renewalDate: subDays(today, 4),
      initiatedById: userInst1.id,
      remarks: 'Linked renewal submitted and verified successfully.',
    },
  });

  // (f) Release Request Mid-Workflow (Submitted -> Scrutiny review passed -> awaiting Authority)
  const fdrReleaseMid = await prisma.fDR.create({
    data: {
      fdrNumber: 'FDR-SBI-2020-REL7',
      institutionId: instSunrise.id,
      bankId: bankSBI.id,
      branchName: 'Hinjewadi, Pune',
      amount: 2500000, // ₹25,00,000
      issueDate: subDays(today, 1850),
      maturityDate: subDays(today, 25), // Fully matured past 5 years
      validityMonths: 60,
      status: 'RELEASE_REQUESTED',
      verificationTier: 'CONFIRMED',
      remarks: 'Matured 5-year security deposit for Closure of PGDM course',
    },
  });

  const relReqMid = await prisma.releaseRequest.create({
    data: {
      fdrId: fdrReleaseMid.id,
      institutionId: instSunrise.id,
      requestNumber: 'REL-2026-001',
      reason: 'Course closure formalities completed as per AICTE Approval Process Handbook Clause 4.8. All student batches graduated.',
      bankAccountNumber: '98765432100012',
      bankIfsc: 'SBIN0001234',
      bankAccountName: 'Sunrise Institute General Account',
      currentStage: 'SCRUTINY_REVIEW',
      eligibilityStatus: 'PASSED',
      eligibilityChecklist: JSON.stringify([
        { item: 'FDR Confirmed by Bank', passed: true },
        { item: 'No open discrepancies or litigation', passed: true },
        { item: 'Prescribed lock-in period satisfied', passed: true },
        { item: 'No pending compliance or dues', passed: true },
      ]),
    },
  });

  await prisma.releaseStage.create({
    data: {
      releaseRequestId: relReqMid.id,
      stageName: 'SUBMISSION',
      actorId: userInst1.id,
      action: 'SUBMITTED',
      observations: 'Release request raised with no-dues certificate attached.',
      timestamp: subDays(today, 3),
    },
  });

  await prisma.releaseStage.create({
    data: {
      releaseRequestId: relReqMid.id,
      stageName: 'SCRUTINY',
      actorId: userOfficer.id,
      action: 'SCRUTINIZED_FORWARD',
      observations: 'All graduation records verified. No pending complaints. Recommended for full release.',
      timestamp: subDays(today, 1),
    },
  });

  // (g) Already Released FDR (with official order number)
  const fdrReleased = await prisma.fDR.create({
    data: {
      fdrNumber: 'FDR-BOB-2019-REL88',
      institutionId: instBharat.id,
      bankId: bankBOB.id,
      branchName: 'M.G. Road Bengaluru',
      amount: 1000000, // ₹10,00,000
      issueDate: subDays(today, 2190),
      maturityDate: subDays(today, 365),
      validityMonths: 60,
      status: 'RELEASED',
      verificationTier: 'CONFIRMED',
      remarks: 'Released upon successful 10-year autonomous status transition',
    },
  });

  const relReqDone = await prisma.releaseRequest.create({
    data: {
      fdrId: fdrReleased.id,
      institutionId: instBharat.id,
      requestNumber: 'REL-2025-094',
      reason: 'Autonomous institution status awarded; compliance lock-in completed.',
      bankAccountNumber: '44556677889900',
      bankIfsc: 'BARB0005678',
      bankAccountName: 'Bharat College Corpus Account',
      currentStage: 'APPROVED',
      eligibilityStatus: 'PASSED',
      eligibilityChecklist: JSON.stringify([
        { item: 'FDR Confirmed by Bank', passed: true },
        { item: 'No open discrepancies', passed: true },
        { item: 'Prescribed lock-in satisfied', passed: true },
      ]),
      releaseOrderNumber: 'AICTE/FD/REL/2025/1089',
      releaseDate: subDays(today, 30),
    },
  });

  await prisma.releaseStage.create({
    data: {
      releaseRequestId: relReqDone.id,
      stageName: 'AUTHORITY_DECISION',
      actorId: userAuthority.id,
      action: 'AUTHORITY_APPROVE',
      observations: 'Approved by Competent Authority. Release order generated.',
      timestamp: subDays(today, 30),
    },
  });

  // 5.2 Expiring Instruments for Demo Clock (7 days, 30 days, 60 days, 90 days)
  const expiringConfigs = [
    { days: 7, inst: instSunrise, bank: bankSBI, amt: 1500000, num: 'FDR-SBI-EXP07' },
    { days: 28, inst: instBharat, bank: bankPNB, amt: 2000000, num: 'FDR-PNB-EXP30' },
    { days: 58, inst: instSunrise, bank: bankHDFC, amt: 2500000, num: 'FDR-HDFC-EXP60' },
    { days: 88, inst: instAPJ, bank: bankCANARA, amt: 1000000, num: 'FDR-CANARA-EXP90' },
    { days: 89, inst: instBharat, bank: bankBOB, amt: 1500000, num: 'FDR-BOB-EXP90B' },
  ];

  for (const exp of expiringConfigs) {
    await prisma.fDR.create({
      data: {
        fdrNumber: exp.num,
        institutionId: exp.inst.id,
        bankId: exp.bank.id,
        branchName: `${exp.bank.name} Central`,
        amount: exp.amt,
        issueDate: subDays(today, 365 * 3 - exp.days),
        maturityDate: addDays(today, exp.days),
        validityMonths: 36,
        status: exp.days <= 30 ? 'EXPIRING_SOON' : 'ACTIVE',
        verificationTier: 'CONFIRMED',
        remarks: `Expiring in approximately ${exp.days} days; automated alerts configured.`,
      },
    });
  }

  // 5.3 Overdue / Matured FDRs for Escalation Demo
  const overdueConfigs = [
    { daysOver: 3, inst: instSunrise, bank: bankSBI, amt: 1000000, num: 'FDR-SBI-MAT03' },
    { daysOver: 12, inst: instBharat, bank: bankPNB, amt: 1500000, num: 'FDR-PNB-MAT12' },
    { daysOver: 25, inst: instAPJ, bank: bankHDFC, amt: 2000000, num: 'FDR-HDFC-MAT25' },
  ];

  for (const mat of overdueConfigs) {
    await prisma.fDR.create({
      data: {
        fdrNumber: mat.num,
        institutionId: mat.inst.id,
        bankId: mat.bank.id,
        branchName: `${mat.bank.name} Main Branch`,
        amount: mat.amt,
        issueDate: subDays(today, 365 * 3 + mat.daysOver),
        maturityDate: subDays(today, mat.daysOver),
        validityMonths: 36,
        status: 'MATURED',
        verificationTier: 'CONFIRMED',
        remarks: `Matured ${mat.daysOver} days ago. Pending renewal submission or release request.`,
      },
    });
  }

  // 5.4 Additional 25 FDRs across various states to reach ~40 total records
  const statusPool = [
    'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'SUBMITTED', 'UNDER_SCRUTINY',
    'BANK_VERIFICATION_PENDING', 'VERIFIED_CONFIRMED', 'ACTIVE', 'DRAFT',
    'ACTIVE', 'UNDER_SCRUTINY', 'ACTIVE', 'VERIFIED_CONFIRMED', 'REJECTED'
  ];

  const amounts = [500000, 1000000, 1500000, 2000000, 2500000, 3000000, 5000000];
  const institutions = [instSunrise, instBharat, instAPJ];

  for (let i = 1; i <= 25; i++) {
    const inst = institutions[i % institutions.length];
    const bank = banks[i % banks.length];
    const amt = amounts[i % amounts.length];
    const st = statusPool[i % statusPool.length];
    const tier = (st === 'VERIFIED_CONFIRMED' || st === 'ACTIVE' || st === 'RELEASED') 
      ? 'CONFIRMED' 
      : (st === 'DISCREPANCY_FLAGGED' || st === 'RESUBMISSION_REQUIRED') 
        ? 'FLAGGED' 
        : 'CLAIMED';

    const issueDaysAgo = 100 + i * 25;
    const maturityDaysFuture = (365 * 3) - issueDaysAgo;

    await prisma.fDR.create({
      data: {
        fdrNumber: `FDR-${bank.code}-2024-${1000 + i}`,
        institutionId: inst.id,
        bankId: bank.id,
        branchName: `${bank.name} City Branch ${i}`,
        amount: amt,
        issueDate: subDays(today, issueDaysAgo),
        maturityDate: addDays(today, maturityDaysFuture),
        validityMonths: 36,
        status: st,
        verificationTier: tier,
        remarks: `FDR instrument for academic approval session 2024-2025 (Reference #${i})`,
      },
    });
  }

  const totalFdrCount = await prisma.fDR.count();
  console.log(`✅ Created ${totalFdrCount} total FDR records!`);

  // 6. Reminder Rules
  console.log('⏰ Seeding Reminder Rules (90, 60, 30, 7 days)...');
  await prisma.reminderRule.createMany({
    data: [
      { daysBeforeMaturity: 90, notificationChannel: 'EMAIL_AND_SMS', targetRole: 'INSTITUTION' },
      { daysBeforeMaturity: 60, notificationChannel: 'EMAIL_AND_SMS', targetRole: 'INSTITUTION' },
      { daysBeforeMaturity: 30, notificationChannel: 'EMAIL_AND_SMS', targetRole: 'INSTITUTION' },
      { daysBeforeMaturity: 7,  notificationChannel: 'EMAIL_AND_SMS', targetRole: 'INSTITUTION' },
    ],
  });

  // 7. Escalation Rules
  console.log('🚨 Seeding Escalation Rules...');
  await prisma.escalationRule.createMany({
    data: [
      { daysOverdue: 1,  targetRole: 'SCRUTINY_OFFICER',   escalationAction: 'NOTIFY_OFFICER' },
      { daysOverdue: 7,  targetRole: 'SCRUTINY_OFFICER',   escalationAction: 'NOTIFY_OFFICER_URGENT' },
      { daysOverdue: 15, targetRole: 'COMPETENT_AUTHORITY', escalationAction: 'NOTIFY_AUTHORITY' },
    ],
  });

  // 8. System Settings
  console.log('⚙️ Seeding System Settings...');
  await prisma.systemSetting.createMany({
    data: [
      { key: 'demo_clock_offset_days', value: '0', description: 'Simulated time-travel offset in days for demo walkthrough' },
      { key: 'demo_mode', value: 'true', description: 'Enables quick-login, demo guide, mock APIs and time travel' },
      { key: 'aicte_minimum_deposit', value: '500000', description: 'Minimum prescribed security deposit per program' },
      { key: 'bank_api_mock_mode', value: 'true', description: 'Toggle between live bank CBS integrations and mock adapter' },
    ],
  });

  // 9. Initial Sample Notifications and SMS Outbox
  console.log('📬 Seeding Notifications and SMS Outbox records...');
  await prisma.notification.createMany({
    data: [
      {
        institutionId: instSunrise.id,
        userId: userInst1.id,
        title: 'Maturity Alert (7 Days Remaining)',
        message: 'Your FDR #FDR-SBI-EXP07 of ₹15,00,000 matures on ' + addDays(today, 7).toLocaleDateString('en-IN') + '. Please submit renewal or release request.',
        type: 'REMINDER',
        isRead: false,
      },
      {
        institutionId: instSunrise.id,
        userId: userInst1.id,
        title: 'Bank Verification Mismatch',
        message: 'Discrepancy detected for FDR #FDR-HDFC-9921: Bank confirmed amount ₹20,00,000 vs claimed ₹25,00,000. Resubmission required.',
        type: 'DISCREPANCY',
        isRead: false,
      },
      {
        institutionId: instSunrise.id,
        userId: userInst1.id,
        title: 'Release Request Scrutinized',
        message: 'Release Request REL-2026-001 has been reviewed by Scrutiny Officer and recommended for Competent Authority approval.',
        type: 'RELEASE',
        isRead: true,
      },
    ],
  });

  await prisma.smsOutbox.createMany({
    data: [
      {
        recipientPhone: '+91 98765 43210',
        message: 'AICTE Alert: FDR #FDR-SBI-EXP07 (₹15L) matures in 7 days. Log in to DEPOSIT-TRACK to renew. -AICTE',
        status: 'DELIVERED',
        sentAt: subDays(today, 1),
      },
      {
        recipientPhone: '+91 98765 43210',
        message: 'AICTE Alert: Discrepancy flagged on FDR-HDFC-9921. Please review CBS mismatch report and resubmit.',
        status: 'DELIVERED',
        sentAt: subDays(today, 2),
      },
    ],
  });

  // 10. Immutable Hash-Chained Audit Trail
  console.log('🔒 Seeding Immutable SHA-256 Hash-Chained Audit Logs...');
  let prevHash = '0000000000000000000000000000000000000000000000000000000000000000'; // Genesis Hash

  const auditEvents = [
    {
      entityType: 'SYSTEM',
      entityId: 'INIT',
      action: 'SYSTEM_BOOT',
      actorId: userAdmin.id,
      actorName: userAdmin.fullName,
      actorRole: 'SYSTEM_ADMIN',
      ipAddress: '127.0.0.1',
      userAgent: 'DepositTrack-Bootstrap/1.0',
      beforeState: null,
      afterState: JSON.stringify({ status: 'INITIALIZED', schemaVersion: '1.0' }),
      timestamp: subDays(today, 30),
    },
    {
      entityType: 'USER',
      entityId: userInst1.id,
      action: 'LOGIN',
      actorId: userInst1.id,
      actorName: userInst1.fullName,
      actorRole: 'INSTITUTION',
      ipAddress: '103.21.124.5',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      beforeState: null,
      afterState: JSON.stringify({ method: 'PASSWORD_PLUS_2FA_OTP', status: 'SUCCESS' }),
      timestamp: subDays(today, 15),
    },
    {
      entityType: 'FDR',
      entityId: fdrDup1.id,
      action: 'CREATE',
      actorId: userInst1.id,
      actorName: userInst1.fullName,
      actorRole: 'INSTITUTION',
      ipAddress: '103.21.124.5',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      beforeState: null,
      afterState: JSON.stringify({ fdrNumber: 'FDR-SBI-2024-DUP99', amount: 1500000 }),
      timestamp: subDays(today, 15),
    },
    {
      entityType: 'FDR',
      entityId: fdrMismatch.id,
      action: 'VERIFY',
      actorId: userOfficer.id,
      actorName: userOfficer.fullName,
      actorRole: 'SCRUTINY_OFFICER',
      ipAddress: '14.139.60.2',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      beforeState: JSON.stringify({ status: 'SUBMITTED', tier: 'CLAIMED' }),
      afterState: JSON.stringify({ status: 'RESUBMISSION_REQUIRED', tier: 'FLAGGED', mismatch: 'amount' }),
      timestamp: subDays(today, 10),
    },
    {
      entityType: 'RELEASE_REQUEST',
      entityId: relReqMid.id,
      action: 'APPROVE',
      actorId: userOfficer.id,
      actorName: userOfficer.fullName,
      actorRole: 'SCRUTINY_OFFICER',
      ipAddress: '14.139.60.2',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      beforeState: JSON.stringify({ currentStage: 'SUBMITTED' }),
      afterState: JSON.stringify({ currentStage: 'SCRUTINY_REVIEW', action: 'FORWARDED_TO_AUTHORITY' }),
      timestamp: subDays(today, 1),
    },
  ];

  for (const event of auditEvents) {
    const rawData = `${event.entityType}:${event.entityId}:${event.action}:${event.actorId}:${event.timestamp.toISOString()}:${event.afterState || ''}`;
    const currHash = calculateHash(rawData, prevHash);

    await prisma.auditLog.create({
      data: {
        entityType: event.entityType,
        entityId: event.entityId,
        action: event.action,
        actorId: event.actorId,
        actorName: event.actorName,
        actorRole: event.actorRole,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        beforeState: event.beforeState,
        afterState: event.afterState,
        prevHash,
        currHash,
        timestamp: event.timestamp,
      },
    });

    prevHash = currHash; // Chain continues!
  }

  console.log(`✅ Audit hash chain seeded successfully! Tip hash: ${prevHash.substring(0, 16)}...`);
  console.log('✨ DEPOSIT-TRACK seed completed successfully! All systems ready for demo.');
}

// Execute when invoked directly
if (require.main === module) {
  seedDatabase()
    .catch((e) => {
      console.error('❌ Seeding error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
