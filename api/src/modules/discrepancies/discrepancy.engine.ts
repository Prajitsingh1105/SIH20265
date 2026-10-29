import { prisma } from '../../config/db';

export interface DiscrepancyResult {
  ruleCode: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  fieldReference: string;
}

export class DiscrepancyEngine {
  /**
   * Evaluates all discrepancy rules against an FDR record
   */
  public static async evaluateFdr(fdrId: string): Promise<DiscrepancyResult[]> {
    const fdr = await prisma.fDR.findUnique({
      where: { id: fdrId },
      include: {
        institution: true,
        bank: true,
        documents: { where: { isDeleted: false } },
        verifications: { orderBy: { verifiedAt: 'desc' }, take: 1 },
      },
    });

    if (!fdr) return [];

    const flags: DiscrepancyResult[] = [];
    const today = new Date();

    // Rule 1: DATE_MISMATCH
    if (fdr.maturityDate <= fdr.issueDate) {
      flags.push({
        ruleCode: 'DATE_MISMATCH',
        severity: 'HIGH',
        message: 'Invalid maturity date: Maturity date must be strictly after the issue date.',
        fieldReference: 'maturityDate',
      });
    }

    const tenureDays = Math.round((fdr.maturityDate.getTime() - fdr.issueDate.getTime()) / (1000 * 60 * 60 * 24));
    if (tenureDays < 365) {
      flags.push({
        ruleCode: 'DATE_MISMATCH',
        severity: 'MEDIUM',
        message: `FDR validity tenure is ${tenureDays} days (less than minimum 1 year / 365 days required by AICTE).`,
        fieldReference: 'validityMonths',
      });
    }

    // Rule 2: DUPLICATE_FDR across the entire repository
    const duplicates = await prisma.fDR.findMany({
      where: {
        fdrNumber: fdr.fdrNumber,
        id: { not: fdr.id },
      },
      include: { institution: true },
    });

    if (duplicates.length > 0) {
      const dupInsts = duplicates.map((d) => d.institution.name).join(', ');
      flags.push({
        ruleCode: 'DUPLICATE_FDR',
        severity: 'HIGH',
        message: `FDR number '${fdr.fdrNumber}' is already registered in the portal under: ${dupInsts}.`,
        fieldReference: 'fdrNumber',
      });
    }

    // Rule 3: AMOUNT_MISMATCH
    const minSetting = await prisma.systemSetting.findUnique({ where: { key: 'aicte_minimum_deposit' } });
    const minRequired = minSetting ? parseFloat(minSetting.value) : 500000;

    if (fdr.amount < minRequired) {
      flags.push({
        ruleCode: 'AMOUNT_MISMATCH',
        severity: 'HIGH',
        message: `FDR amount (₹${fdr.amount.toLocaleString('en-IN')}) is below minimum AICTE requirement of ₹${minRequired.toLocaleString('en-IN')}.`,
        fieldReference: 'amount',
      });
    }

    // Check against latest bank verification record if exists
    if (fdr.verifications.length > 0) {
      const ver = fdr.verifications[0];
      if (ver.bankConfirmedAmount && Math.abs(ver.bankConfirmedAmount - fdr.amount) > 0.01) {
        flags.push({
          ruleCode: 'AMOUNT_MISMATCH',
          severity: 'HIGH',
          message: `Amount mismatch: Claimed amount ₹${fdr.amount.toLocaleString('en-IN')} does not match Bank CBS record of ₹${ver.bankConfirmedAmount.toLocaleString('en-IN')}.`,
          fieldReference: 'amount',
        });
      }
    }

    // Rule 4: MISSING_DOCUMENTS
    const hasReceipt = fdr.documents.some((d) => d.docType === 'FDR_RECEIPT');
    if (!hasReceipt && fdr.status !== 'DRAFT') {
      flags.push({
        ruleCode: 'MISSING_DOCUMENTS',
        severity: 'HIGH',
        message: 'Mandatory original FDR receipt/certificate scan is missing.',
        fieldReference: 'documents',
      });
    }

    // Rule 5: EXPIRED_INSTRUMENT
    if (fdr.maturityDate < today && fdr.status !== 'MATURED' && fdr.status !== 'RENEWED' && fdr.status !== 'RELEASED') {
      flags.push({
        ruleCode: 'EXPIRED_INSTRUMENT',
        severity: 'MEDIUM',
        message: `FDR instrument matured on ${fdr.maturityDate.toLocaleDateString('en-IN')}. Overdue for renewal or release.`,
        fieldReference: 'maturityDate',
      });
    }

    // Rule 6: OCR_MISMATCH
    if (fdr.ocrData) {
      try {
        const ocr = JSON.parse(fdr.ocrData);
        if (ocr.amount && Math.abs(parseFloat(ocr.amount) - fdr.amount) > 100) {
          flags.push({
            ruleCode: 'OCR_MISMATCH',
            severity: 'LOW',
            message: `Entered amount (₹${fdr.amount.toLocaleString('en-IN')}) differs from OCR extracted value (₹${parseFloat(ocr.amount).toLocaleString('en-IN')}).`,
            fieldReference: 'amount',
          });
        }
      } catch {
        // Ignore OCR JSON parse error
      }
    }

    return flags;
  }

  /**
   * Runs discrepancy checks, persists new flags to database, and updates FDR status/tier
   */
  public static async runAndSync(fdrId: string) {
    const detected = await this.evaluateFdr(fdrId);

    // Fetch existing unresolved flags
    const existing = await prisma.discrepancyFlag.findMany({
      where: { fdrId, isResolved: false },
    });

    const existingCodes = new Set(existing.map((e) => e.ruleCode));

    // Insert new flags
    for (const flag of detected) {
      if (!existingCodes.has(flag.ruleCode)) {
        await prisma.discrepancyFlag.create({
          data: {
            fdrId,
            ruleCode: flag.ruleCode,
            severity: flag.severity,
            message: flag.message,
            fieldReference: flag.fieldReference,
          },
        });
      }
    }

    const allUnresolved = await prisma.discrepancyFlag.findMany({
      where: { fdrId, isResolved: false },
    });

    // If there are high or medium severity flags, mark tier as FLAGGED
    if (allUnresolved.some((f) => f.severity === 'HIGH' || f.severity === 'MEDIUM')) {
      await prisma.fDR.update({
        where: { id: fdrId },
        data: {
          verificationTier: 'FLAGGED',
          status: 'DISCREPANCY_FLAGGED',
        },
      });
    }

    return allUnresolved;
  }
}
