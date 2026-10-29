import { prisma } from '../../config/db';
import { PdfService } from '../../utils/pdf.service';
import { StorageService } from '../documents/storage.service';
import { AuditService } from '../audit/audit.service';
import { sendEmail } from '../../config/mailer';

export class ReleaseService {
  /**
   * Automated eligibility checklist calculation
   */
  public static async evaluateEligibility(fdrId: string) {
    const fdr = await prisma.fDR.findUnique({
      where: { id: fdrId },
      include: {
        documents: { where: { isDeleted: false } },
        discrepancies: { where: { isResolved: false } },
      },
    });

    if (!fdr) throw new Error('FDR not found');

    const bankConfirmed = fdr.verificationTier === 'CONFIRMED';
    const noDiscrepancies = fdr.discrepancies.length === 0;
    const documentsComplete = fdr.documents.length > 0;
    const maturitySatisfied = new Date() >= fdr.maturityDate;

    const checklist = [
      {
        code: 'BANK_CONFIRMED',
        label: 'FDR Confirmed by Bank (Two-Tier Trust)',
        passed: bankConfirmed,
        details: bankConfirmed ? 'Bank verification confirmed in ledger' : 'Pending bank verification or flagged mismatch',
      },
      {
        code: 'NO_DISCREPANCIES',
        label: 'No Open Discrepancy Flags',
        passed: noDiscrepancies,
        details: noDiscrepancies ? 'All compliance rules satisfied' : `${fdr.discrepancies.length} open discrepancy flag(s)`,
      },
      {
        code: 'DOCUMENTS_VAULTED',
        label: 'Original FDR & Lien Letters Archived',
        passed: documentsComplete,
        details: documentsComplete ? `${fdr.documents.length} document(s) vaulted` : 'Missing required FDR scan documents',
      },
      {
        code: 'MATURITY_TENURE',
        label: 'Prescribed Lock-in / Maturity Period Satisfied',
        passed: maturitySatisfied,
        details: maturitySatisfied
          ? `Matured on ${fdr.maturityDate.toLocaleDateString('en-IN')}`
          : `Immature (Matures ${fdr.maturityDate.toLocaleDateString('en-IN')}). Premature release requires special council approval.`,
      },
    ];

    const passedCount = checklist.filter((c) => c.passed).length;
    const status = passedCount === checklist.length ? 'PASSED' : passedCount >= 3 ? 'FLAGGED' : 'FAILED';

    return {
      status,
      checklist,
      canProceed: passedCount >= 2, // Allow submission if bank confirmed or officer review requested
    };
  }

  /**
   * Institution initiates a release/refund request
   */
  public static async createRequest(
    fdrId: string,
    institutionId: string,
    userId: string,
    data: {
      reason: string;
      bankAccountNumber: string;
      bankIfsc: string;
      bankAccountName: string;
    }
  ) {
    const fdr = await prisma.fDR.findUnique({
      where: { id: fdrId },
      include: { institution: true },
    });

    if (!fdr) throw new Error('FDR not found');
    if (fdr.institutionId !== institutionId) {
      throw new Error('Unauthorized: You can only raise release requests for your own institution.');
    }

    const eligibility = await this.evaluateEligibility(fdrId);

    const year = new Date().getFullYear();
    const count = await prisma.releaseRequest.count();
    const requestNumber = `REL-${year}-${(count + 1).toString().padStart(3, '0')}`;

    const releaseRequest = await prisma.releaseRequest.create({
      data: {
        fdrId,
        institutionId,
        requestNumber,
        reason: data.reason,
        bankAccountNumber: data.bankAccountNumber,
        bankIfsc: data.bankIfsc.toUpperCase(),
        bankAccountName: data.bankAccountName,
        currentStage: 'SUBMITTED',
        eligibilityStatus: eligibility.status,
        eligibilityChecklist: JSON.stringify(eligibility.checklist),
      },
    });

    // Record Stage 1
    await prisma.releaseStage.create({
      data: {
        releaseRequestId: releaseRequest.id,
        stageName: 'SUBMISSION',
        actorId: userId,
        action: 'SUBMITTED',
        observations: `Request submitted by institution. Reason: ${data.reason}`,
      },
    });

    // Update FDR status
    await prisma.fDR.update({
      where: { id: fdrId },
      data: { status: 'RELEASE_REQUESTED' },
    });

    // Audit log
    await AuditService.log({
      entityType: 'RELEASE_REQUEST',
      entityId: releaseRequest.id,
      action: 'CREATE',
      actorId: userId,
      afterState: { requestNumber, fdrId, eligibility: eligibility.status },
    });

    return releaseRequest;
  }

  /**
   * Scrutiny Officer scrutinizes the release request
   */
  public static async scrutinize(
    requestId: string,
    officerId: string,
    action: 'SCRUTINIZED_FORWARD' | 'SCRUTINIZED_RETURN' | 'REJECT',
    observations: string
  ) {
    const req = await prisma.releaseRequest.findUnique({
      where: { id: requestId },
      include: { fdr: true, institution: true },
    });

    if (!req) throw new Error('Release request not found');

    const nextStage =
      action === 'SCRUTINIZED_FORWARD'
        ? 'AUTHORITY_APPROVAL'
        : action === 'SCRUTINIZED_RETURN'
          ? 'RETURNED'
          : 'REJECTED';

    await prisma.releaseRequest.update({
      where: { id: requestId },
      data: { currentStage: nextStage },
    });

    await prisma.releaseStage.create({
      data: {
        releaseRequestId: requestId,
        stageName: 'SCRUTINY',
        actorId: officerId,
        action,
        observations,
      },
    });

    if (action === 'REJECT') {
      await prisma.fDR.update({
        where: { id: req.fdrId },
        data: { status: 'REJECTED' },
      });
    }

    // Notify institution
    await prisma.notification.create({
      data: {
        institutionId: req.institutionId,
        title: `Release Request ${req.requestNumber} Scrutinized`,
        message: `Officer Observation: ${observations}. Status: ${nextStage}`,
        type: 'RELEASE',
      },
    });

    await AuditService.log({
      entityType: 'RELEASE_REQUEST',
      entityId: requestId,
      action: action,
      actorId: officerId,
      afterState: { currentStage: nextStage, observations },
    });

    return { success: true, nextStage };
  }

  /**
   * Competent Authority final decision (Approve, Reject, Return)
   */
  public static async authorityDecision(
    requestId: string,
    authorityId: string,
    action: 'AUTHORITY_APPROVE' | 'AUTHORITY_REJECT' | 'AUTHORITY_RETURN',
    observations: string
  ) {
    const req = await prisma.releaseRequest.findUnique({
      where: { id: requestId },
      include: { fdr: { include: { bank: true } }, institution: true },
    });

    if (!req) throw new Error('Release request not found');

    const authority = await prisma.user.findUnique({ where: { id: authorityId } });

    if (action === 'AUTHORITY_APPROVE') {
      const year = new Date().getFullYear();
      const count = await prisma.fDRDocument.count({ where: { docType: 'RELEASE_ORDER' } });
      const orderNumber = `AICTE/FD/REL/${year}/${(count + 1).toString().padStart(4, '0')}`;

      // 1. Generate PDF
      const pdfBuffer = await PdfService.generateReleaseOrderPdf({
        orderNumber,
        orderDate: new Date(),
        institutionName: req.institution.name,
        institutionCode: req.institution.code,
        fdrNumber: req.fdr.fdrNumber,
        bankName: req.fdr.bank.name,
        branchName: req.fdr.branchName,
        amount: req.fdr.amount,
        issueDate: req.fdr.issueDate,
        maturityDate: req.fdr.maturityDate,
        refundAccount: {
          accountNumber: req.bankAccountNumber,
          ifsc: req.bankIfsc,
          accountName: req.bankAccountName,
        },
        approvedBy: authority?.fullName || 'Competent Authority, AICTE',
        authorityDesignation: authority?.designation || 'Adviser (Approval Bureau)',
      });

      // 2. Upload to Document Vault (AES-256 encrypted)
      const upload = await StorageService.uploadEncrypted(
        pdfBuffer,
        `Release_Order_${orderNumber.replace(/\//g, '_')}.pdf`,
        'application/pdf'
      );

      // 3. Create FDRDocument record
      const releaseDoc = await prisma.fDRDocument.create({
        data: {
          fdrId: req.fdrId,
          docType: 'RELEASE_ORDER',
          title: `Official Release Order (${orderNumber})`,
          fileKey: upload.fileKey,
          originalName: `Release_Order_${orderNumber.replace(/\//g, '_')}.pdf`,
          mimeType: 'application/pdf',
          fileSize: upload.fileSize,
          checksumSha256: upload.checksum,
          uploadedById: authorityId,
        },
      });

      // 4. Update Release Request
      await prisma.releaseRequest.update({
        where: { id: requestId },
        data: {
          currentStage: 'APPROVED',
          releaseOrderNumber: orderNumber,
          releaseOrderDocId: releaseDoc.id,
          releaseDate: new Date(),
        },
      });

      // 5. Update FDR status to RELEASED
      await prisma.fDR.update({
        where: { id: req.fdrId },
        data: { status: 'RELEASED' },
      });

      // 6. Record Stage
      await prisma.releaseStage.create({
        data: {
          releaseRequestId: requestId,
          stageName: 'AUTHORITY_DECISION',
          actorId: authorityId,
          action: 'AUTHORITY_APPROVE',
          observations: observations || 'Sanction accorded for full release of security deposit and lien clearance.',
        },
      });

      // 7. Send Notifications & Email
      await prisma.notification.create({
        data: {
          institutionId: req.institutionId,
          title: `🎉 Deposit Released! Order No: ${orderNumber}`,
          message: `Your FDR #${req.fdr.fdrNumber} (₹${req.fdr.amount.toLocaleString('en-IN')}) has been officially released. Download your Release Order from the portal.`,
          type: 'RELEASE',
        },
      });

      await prisma.smsOutbox.create({
        data: {
          recipientPhone: req.institution.phone || '+91 98765 43210',
          message: `AICTE: Security deposit release order ${orderNumber} approved for FDR ${req.fdr.fdrNumber}. -AICTE`,
          status: 'DELIVERED',
        },
      });

      await sendEmail({
        to: req.institution.email,
        subject: `[AICTE SANCTION ORDER] Security Deposit Released: Order No ${orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #138808; border-radius: 8px;">
            <h2 style="color: #138808;">AICTE Security Deposit Release Order Issued</h2>
            <p>Dear ${req.institution.name},</p>
            <p>We are pleased to convey that your request for the release of FDR <strong>#${req.fdr.fdrNumber}</strong> of <strong>₹${req.fdr.amount.toLocaleString('en-IN')}</strong> has been approved by the Competent Authority.</p>
            <p><strong>Sanction Order Reference:</strong> ${orderNumber}</p>
            <p>The lien on the instrument has been revoked and the designated refund account will be credited as per bank clearance rules.</p>
          </div>
        `,
      });

      await AuditService.log({
        entityType: 'RELEASE_REQUEST',
        entityId: requestId,
        action: 'APPROVE',
        actorId: authorityId,
        afterState: { currentStage: 'APPROVED', orderNumber, releaseDocId: releaseDoc.id },
      });

      return { success: true, orderNumber, releaseDocId: releaseDoc.id };
    } else {
      const nextStage = action === 'AUTHORITY_RETURN' ? 'RETURNED' : 'REJECTED';

      await prisma.releaseRequest.update({
        where: { id: requestId },
        data: { currentStage: nextStage },
      });

      await prisma.releaseStage.create({
        data: {
          releaseRequestId: requestId,
          stageName: 'AUTHORITY_DECISION',
          actorId: authorityId,
          action,
          observations,
        },
      });

      if (action === 'AUTHORITY_REJECT') {
        await prisma.fDR.update({
          where: { id: req.fdrId },
          data: { status: 'REJECTED' },
        });
      }

      await AuditService.log({
        entityType: 'RELEASE_REQUEST',
        entityId: requestId,
        action,
        actorId: authorityId,
        afterState: { currentStage: nextStage, observations },
      });

      return { success: true, nextStage };
    }
  }
}
