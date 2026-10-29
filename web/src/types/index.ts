export type UserRole = 'INSTITUTION' | 'SCRUTINY_OFFICER' | 'COMPETENT_AUTHORITY' | 'SYSTEM_ADMIN';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  designation?: string;
  phone?: string;
  role: UserRole;
  roleDisplayName?: string;
  institutionId?: string | null;
  institution?: {
    id: string;
    code: string;
    name: string;
    state: string;
  };
}

export type FdrStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_SCRUTINY'
  | 'DISCREPANCY_FLAGGED'
  | 'RESUBMISSION_REQUIRED'
  | 'BANK_VERIFICATION_PENDING'
  | 'VERIFIED_CONFIRMED'
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'MATURED'
  | 'RENEWED'
  | 'RELEASE_REQUESTED'
  | 'RELEASED'
  | 'REJECTED';

export type VerificationTier = 'CLAIMED' | 'CONFIRMED' | 'FLAGGED';

export interface Bank {
  id: string;
  code: string;
  name: string;
  ifscPrefix: string;
  branch?: string;
}

export interface Institution {
  id: string;
  code: string;
  name: string;
  aisheCode?: string;
  state: string;
  district?: string;
}

export interface FDRDocument {
  id: string;
  fdrId: string;
  docType: 'FDR_RECEIPT' | 'SANCTION_LETTER' | 'LIEN_LETTER' | 'BANK_CONFIRMATION' | 'RELEASE_ORDER' | 'OTHER';
  title: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  checksumSha256: string;
  isEncrypted: boolean;
  currentVersion: number;
  createdAt: string;
  versions?: DocumentVersion[];
}

export interface DocumentVersion {
  id: string;
  version: number;
  originalName: string;
  fileSize: number;
  checksumSha256: string;
  changeReason?: string;
  createdAt: string;
}

export interface DiscrepancyFlag {
  id: string;
  fdrId: string;
  ruleCode: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  fieldReference?: string;
  isResolved: boolean;
  resolutionRemark?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface Verification {
  id: string;
  fdrId: string;
  verificationType: 'MOCK_API' | 'MANUAL_LETTER';
  bankConfirmedNumber?: string;
  bankConfirmedBank?: string;
  bankConfirmedBranch?: string;
  bankConfirmedAmount?: number;
  bankConfirmedIssueDate?: string;
  bankConfirmedMaturity?: string;
  isMatched: boolean;
  mismatchDetails?: string;
  remarks?: string;
  verifiedAt: string;
}

export interface ScrutinyNote {
  id: string;
  fdrId: string;
  note: string;
  recommendation: 'FORWARD_TO_AUTHORITY' | 'REQUEST_RESUBMISSION' | 'REJECT' | 'NEUTRAL';
  officer?: { fullName: string; designation?: string };
  createdAt: string;
}

export interface ReleaseStage {
  id: string;
  stageName: string;
  action: string;
  observations?: string;
  timestamp: string;
  actor?: { fullName: string; designation?: string; role?: string };
}

export interface ReleaseRequest {
  id: string;
  fdrId: string;
  institutionId: string;
  requestNumber: string;
  reason: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankAccountName: string;
  currentStage: 'SUBMITTED' | 'SCRUTINY_REVIEW' | 'AUTHORITY_APPROVAL' | 'APPROVED' | 'REJECTED' | 'RETURNED';
  eligibilityStatus: 'PASSED' | 'FAILED' | 'FLAGGED' | 'PENDING';
  eligibilityChecklist?: string;
  releaseOrderNumber?: string;
  releaseDate?: string;
  createdAt: string;
  fdr?: FDR;
  institution?: Institution;
  stages?: ReleaseStage[];
}

export interface FDR {
  id: string;
  fdrNumber: string;
  institutionId: string;
  institution?: Institution;
  bankId: string;
  bank?: Bank;
  branchName: string;
  amount: number;
  issueDate: string;
  maturityDate: string;
  validityMonths: number;
  lienPledgeInFavor: string;
  status: FdrStatus;
  verificationTier: VerificationTier;
  remarks?: string;
  parentFdrId?: string;
  isRenewal: boolean;
  createdAt: string;
  updatedAt: string;
  documents?: FDRDocument[];
  verifications?: Verification[];
  discrepancies?: DiscrepancyFlag[];
  scrutinyNotes?: ScrutinyNote[];
  releaseRequests?: ReleaseRequest[];
  renewalsAsOld?: any[];
  renewalsAsNew?: any[];
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId?: string;
  action: string;
  actorName?: string;
  actorRole?: string;
  ipAddress?: string;
  beforeState?: string;
  afterState?: string;
  prevHash: string;
  currHash: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface SmsOutbox {
  id: string;
  recipientPhone: string;
  message: string;
  status: string;
  sentAt: string;
}
