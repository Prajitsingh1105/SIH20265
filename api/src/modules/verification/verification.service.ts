import { prisma } from '../../config/db';
import { AuditService } from '../audit/audit.service';
import { sendEmail } from '../../config/mailer';
import { DiscrepancyEngine } from '../discrepancies/discrepancy.engine';

export interface BankVerificationQuery {
  fdrId: string;
  verifiedById: string;
  verificationType: 'MOCK_API' | 'MANUAL_LETTER';
  manualDetails?: {
    letterDocumentId?: string;
    remarks?: string;
    confirmedAmount?: number;
    confirmedMaturityDate?: string;
  };
}

export class VerificationService {
  /**
   * Queries Mock Bank CBS API or uses manual officer confirmation
   */
  public static async verifyFdr(query: BankVerificationQuery) {
    const fdr = await prisma.fDR.findUnique({
      where: { id: query.fdrId },
      include: { bank: true, institution: true },
    });

    if (!fdr) throw new Error('FDR not found');

    let bankConfirmedNumber = fdr.fdrNumber;
    let bankConfirmedBank = fdr.bank.name;
    let bankConfirmedBranch = fdr.branchName;
    let bankConfirmedAmount = fdr.amount;
    let bankConfirmedIssueDate = fdr.issueDate;
    let bankConfirmedMaturity = fdr.maturityDate;
    let remarks = 'Automated Core Banking System (CBS) real-time response: Valid & Active.';

    // Check for deliberate demo mismatches:
    // 1. FDR-HDFC-9921 -> deliberate amount mismatch (20L instead of 25L)
    if (fdr.fdrNumber === 'FDR-HDFC-9921') {
      bankConfirmedAmount = 2000000;
      remarks = 'CBS Response: Record found with amount mismatch (₹20,00,000 recorded in CBS ledger).';
    }

    if (query.verificationType === 'MANUAL_LETTER' && query.manualDetails) {
      if (query.manualDetails.confirmedAmount) {
        bankConfirmedAmount = query.manualDetails.confirmedAmount;
      }
      if (query.manualDetails.confirmedMaturityDate) {
        bankConfirmedMaturity = new Date(query.manualDetails.confirmedMaturityDate);
      }
      remarks = query.manualDetails.remarks || 'Verified manually against official bank confirmation letter.';
    }

    // Determine field-level matches
    const mismatches: Record<string, { claimed: any; confirmed: any }> = {};

    if (Math.abs(fdr.amount - bankConfirmedAmount) > 0.01) {
      mismatches.amount = { claimed: fdr.amount, confirmed: bankConfirmedAmount };
    }

    const isMatched = Object.keys(mismatches).length === 0;

    // Save verification record
    const verification = await prisma.verification.create({
      data: {
        fdrId: fdr.id,
        verificationType: query.verificationType,
        verifiedById: query.verifiedById,
        bankConfirmedNumber,
        bankConfirmedBank,
        bankConfirmedBranch,
        bankConfirmedAmount,
        bankConfirmedIssueDate,
        bankConfirmedMaturity,
        isMatched,
        mismatchDetails: Object.keys(mismatches).length > 0 ? JSON.stringify(mismatches) : null,
        letterDocumentId: query.manualDetails?.letterDocumentId || null,
        remarks,
      },
    });

    if (isMatched) {
      // Turn green!
      await prisma.fDR.update({
        where: { id: fdr.id },
        data: {
          verificationTier: 'CONFIRMED',
          status: 'VERIFIED_CONFIRMED',
        },
      });

      // Clear any previous bank mismatch discrepancy
      await prisma.discrepancyFlag.updateMany({
        where: { fdrId: fdr.id, ruleCode: 'AMOUNT_MISMATCH' },
        data: {
          isResolved: true,
          resolvedById: query.verifiedById,
          resolutionRemark: 'Bank confirmed exact amount match.',
          resolvedAt: new Date(),
        },
      });

      // Notify institution of successful verification
      await prisma.notification.create({
        data: {
          institutionId: fdr.institutionId,
          title: 'Bank Verification Successful (Confirmed)',
          message: `FDR #${fdr.fdrNumber} (₹${fdr.amount.toLocaleString('en-IN')}) has been confirmed by ${fdr.bank.name}. Trust tier updated to Confirmed.`,
          type: 'VERIFICATION',
        },
      });
    } else {
      // Mismatch -> Turn red and require resubmission
      await prisma.fDR.update({
        where: { id: fdr.id },
        data: {
          verificationTier: 'FLAGGED',
          status: 'RESUBMISSION_REQUIRED',
        },
      });

      // Re-run discrepancy sync to register amount mismatch flag
      await DiscrepancyEngine.runAndSync(fdr.id);

      // Create notification
      const notifMsg = `Bank verification mismatch detected for FDR #${fdr.fdrNumber}. Claimed ₹${fdr.amount.toLocaleString('en-IN')} vs Bank CBS ₹${bankConfirmedAmount.toLocaleString('en-IN')}. Please review and resubmit.`;

      await prisma.notification.create({
        data: {
          institutionId: fdr.institutionId,
          title: 'Resubmission Required: Bank Mismatch',
          message: notifMsg,
          type: 'DISCREPANCY',
        },
      });

      await prisma.smsOutbox.create({
        data: {
          recipientPhone: fdr.institution.phone || '+91 98765 43210',
          message: `AICTE Alert: Bank check mismatch on FDR ${fdr.fdrNumber}. Resubmission required. -AICTE`,
          status: 'DELIVERED',
        },
      });

      await sendEmail({
        to: fdr.institution.email,
        subject: `[ACTION REQUIRED] Resubmission Required for FDR ${fdr.fdrNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #b91c1c;">Bank Verification Discrepancy Flagged</h2>
            <p>Dear ${fdr.institution.name},</p>
            <p>${notifMsg}</p>
            <p>Please log in to DEPOSIT-TRACK to correct the discrepancy and resubmit for approval.</p>
          </div>
        `,
      });
    }

    // Audit log
    await AuditService.log({
      entityType: 'FDR',
      entityId: fdr.id,
      action: 'VERIFY',
      actorId: query.verifiedById,
      afterState: {
        verificationId: verification.id,
        isMatched,
        verificationType: query.verificationType,
        tier: isMatched ? 'CONFIRMED' : 'FLAGGED',
      },
    });

    return {
      verification,
      isMatched,
      mismatches,
    };
  }

  /**
   * Returns side-by-side comparison data
   */
  public static async getComparison(fdrId: string) {
    const fdr = await prisma.fDR.findUnique({
      where: { id: fdrId },
      include: {
        bank: true,
        institution: true,
        verifications: { orderBy: { verifiedAt: 'desc' }, take: 1 },
      },
    });

    if (!fdr) throw new Error('FDR not found');

    const latest = fdr.verifications[0] || null;

    return {
      fdrId: fdr.id,
      fdrNumber: fdr.fdrNumber,
      institution: fdr.institution.name,
      bank: fdr.bank.name,
      claimed: {
        fdrNumber: fdr.fdrNumber,
        bankName: fdr.bank.name,
        branch: fdr.branchName,
        amount: fdr.amount,
        issueDate: fdr.issueDate,
        maturityDate: fdr.maturityDate,
        validityMonths: fdr.validityMonths,
        tier: fdr.verificationTier,
        status: fdr.status,
      },
      confirmed: latest
        ? {
            fdrNumber: latest.bankConfirmedNumber,
            bankName: latest.bankConfirmedBank,
            branch: latest.bankConfirmedBranch,
            amount: latest.bankConfirmedAmount,
            issueDate: latest.bankConfirmedIssueDate,
            maturityDate: latest.bankConfirmedMaturity,
            isMatched: latest.isMatched,
            mismatchDetails: latest.mismatchDetails ? JSON.parse(latest.mismatchDetails) : null,
            remarks: latest.remarks,
            verifiedAt: latest.verifiedAt,
            verificationType: latest.verificationType,
          }
        : null,
    };
  }
}
