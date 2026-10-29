import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { scopeInstitutionFilter } from '../../middleware/auth.middleware';
import { DiscrepancyEngine } from '../discrepancies/discrepancy.engine';
import { AuditService } from '../audit/audit.service';

const createFdrSchema = z.object({
  fdrNumber: z.string().min(3, 'FDR number is required'),
  bankId: z.string().min(1, 'Bank is required'),
  branchName: z.string().min(1, 'Branch name is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  issueDate: z.string().datetime(),
  maturityDate: z.string().datetime(),
  validityMonths: z.number().int().positive().default(36),
  lienPledgeInFavor: z.string().default('Member Secretary, AICTE, New Delhi'),
  remarks: z.string().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED']).default('SUBMITTED'),
  ocrData: z.string().optional(),
  institutionId: z.string().optional(),
});

export class FdrController {
  /**
   * List FDRs with searching, sorting, pagination, and multi-tenant isolation
   */
  public static async getFdrs(req: Request, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(5, parseInt(req.query.limit as string) || 10));
      const skip = (page - 1) * limit;

      const { search, bankId, status, verificationTier, institutionId, sortBy, sortOrder } = req.query;

      let where: any = {};

      // Multi-tenant institution isolation
      where = scopeInstitutionFilter(req, where);

      if (institutionId && req.user?.role !== 'INSTITUTION') {
        where.institutionId = String(institutionId);
      }
      if (bankId) where.bankId = String(bankId);
      if (status) where.status = String(status);
      if (verificationTier) where.verificationTier = String(verificationTier);

      if (search) {
        where.OR = [
          { fdrNumber: { contains: String(search) } },
          { branchName: { contains: String(search) } },
          { institution: { name: { contains: String(search) } } },
          { bank: { name: { contains: String(search) } } },
        ];
      }

      const orderBy: any = {};
      if (sortBy) {
        orderBy[String(sortBy)] = sortOrder === 'asc' ? 'asc' : 'desc';
      } else {
        orderBy.createdAt = 'desc';
      }

      const [total, fdrs] = await Promise.all([
        prisma.fDR.count({ where }),
        prisma.fDR.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            institution: { select: { id: true, code: true, name: true, state: true } },
            bank: { select: { id: true, code: true, name: true } },
            discrepancies: { where: { isResolved: false } },
            documents: { where: { isDeleted: false }, select: { id: true, docType: true, title: true } },
          },
        }),
      ]);

      return res.json({
        success: true,
        data: fdrs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get FDRs error:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve FDR records' });
    }
  }

  /**
   * Get single FDR detail with full relationship tree
   */
  public static async getFdrById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const fdr = await prisma.fDR.findUnique({
        where: { id },
        include: {
          institution: true,
          bank: true,
          documents: {
            where: { isDeleted: false },
            include: { versions: { orderBy: { version: 'desc' } } },
          },
          verifications: { orderBy: { verifiedAt: 'desc' } },
          discrepancies: { orderBy: { createdAt: 'desc' } },
          scrutinyNotes: {
            orderBy: { createdAt: 'desc' },
            include: { officer: { select: { fullName: true, designation: true } } },
          },
          releaseRequests: {
            include: {
              stages: {
                orderBy: { timestamp: 'asc' },
                include: { actor: { select: { fullName: true, designation: true } } },
              },
            },
          },
          renewalsAsOld: { include: { newFdr: true } },
          renewalsAsNew: { include: { previousFdr: true } },
        },
      });

      if (!fdr) {
        return res.status(404).json({ success: false, message: 'FDR record not found' });
      }

      // Check institution access isolation
      if (req.user?.role === 'INSTITUTION' && fdr.institutionId !== req.user.institutionId) {
        return res.status(403).json({ success: false, message: 'Access denied to other institutions records' });
      }

      return res.json({ success: true, data: fdr });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch FDR details' });
    }
  }

  /**
   * Submit / Create new FDR
   */
  public static async createFdr(req: Request, res: Response) {
    try {
      const parsed = createFdrSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, errors: parsed.error.format() });
      }

      const data = parsed.data;

      // Assign institution ID from authenticated institution user
      let targetInstitutionId = req.user?.institutionId;
      if (req.user?.role !== 'INSTITUTION' && data.institutionId) {
        targetInstitutionId = data.institutionId;
      }

      if (!targetInstitutionId) {
        return res.status(400).json({ success: false, message: 'Institution ID is required' });
      }

      const issueDate = new Date(data.issueDate);
      const maturityDate = new Date(data.maturityDate);

      const fdr = await prisma.fDR.create({
        data: {
          fdrNumber: data.fdrNumber.trim().toUpperCase(),
          institutionId: targetInstitutionId,
          bankId: data.bankId,
          branchName: data.branchName,
          amount: data.amount,
          issueDate,
          maturityDate,
          validityMonths: data.validityMonths,
          lienPledgeInFavor: data.lienPledgeInFavor,
          remarks: data.remarks,
          status: data.status,
          verificationTier: 'CLAIMED',
          ocrData: data.ocrData,
        },
      });

      // Synchronously run smart discrepancy detection
      await DiscrepancyEngine.runAndSync(fdr.id);

      // Audit log
      await AuditService.log({
        entityType: 'FDR',
        entityId: fdr.id,
        action: 'CREATE',
        actorId: req.user?.id,
        actorName: req.user?.fullName,
        actorRole: req.user?.role,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        afterState: { fdrNumber: fdr.fdrNumber, amount: fdr.amount, status: fdr.status },
      });

      const updatedFdr = await prisma.fDR.findUnique({
        where: { id: fdr.id },
        include: {
          discrepancies: true,
          bank: true,
          institution: true,
        },
      });

      return res.status(201).json({
        success: true,
        data: updatedFdr,
        message: data.status === 'SUBMITTED' ? 'FDR submitted successfully. Discrepancy checks completed.' : 'FDR saved as draft.',
      });
    } catch (error) {
      console.error('Create FDR error:', error);
      return res.status(500).json({ success: false, message: 'Failed to create FDR' });
    }
  }

  /**
   * Resubmit FDR after fixing discrepancy or bank mismatch
   */
  public static async resubmitFdr(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const fdr = await prisma.fDR.findUnique({ where: { id } });

      if (!fdr) return res.status(404).json({ success: false, message: 'FDR not found' });

      if (req.user?.role === 'INSTITUTION' && fdr.institutionId !== req.user.institutionId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      const { amount, branchName, remarks, issueDate, maturityDate } = req.body;

      const updateData: any = {
        status: 'UNDER_SCRUTINY',
        verificationTier: 'CLAIMED',
      };

      if (amount) updateData.amount = parseFloat(amount);
      if (branchName) updateData.branchName = branchName;
      if (remarks) updateData.remarks = remarks;
      if (issueDate) updateData.issueDate = new Date(issueDate);
      if (maturityDate) updateData.maturityDate = new Date(maturityDate);

      const updated = await prisma.fDR.update({
        where: { id },
        data: updateData,
      });

      // Clear previous bank amount discrepancy flags if amount was updated
      if (amount) {
        await prisma.discrepancyFlag.updateMany({
          where: { fdrId: id, ruleCode: 'AMOUNT_MISMATCH' },
          data: {
            isResolved: true,
            resolutionRemark: `Corrected and resubmitted by institution. New amount: ₹${amount}`,
            resolvedAt: new Date(),
          },
        });
      }

      // Re-run discrepancy check
      await DiscrepancyEngine.runAndSync(id);

      await AuditService.log({
        entityType: 'FDR',
        entityId: id,
        action: 'RESUBMIT',
        actorId: req.user?.id,
        actorName: req.user?.fullName,
        actorRole: req.user?.role,
        ipAddress: req.ip,
        afterState: updateData,
      });

      return res.json({
        success: true,
        data: updated,
        message: 'FDR resubmitted for officer scrutiny and bank re-verification.',
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to resubmit FDR' });
    }
  }

  /**
   * Renew FDR: Preserves parent-child history chain
   */
  public static async renewFdr(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const oldFdr = await prisma.fDR.findUnique({
        where: { id },
        include: { institution: true, bank: true },
      });

      if (!oldFdr) return res.status(404).json({ success: false, message: 'Original FDR not found' });

      if (req.user?.role === 'INSTITUTION' && oldFdr.institutionId !== req.user.institutionId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      const { newFdrNumber, amount, issueDate, maturityDate, branchName, remarks } = req.body;

      // 1. Mark old FDR as RENEWED
      await prisma.fDR.update({
        where: { id: oldFdr.id },
        data: { status: 'RENEWED' },
      });

      // 2. Create new FDR record
      const newFdr = await prisma.fDR.create({
        data: {
          fdrNumber: (newFdrNumber || `${oldFdr.fdrNumber}-REN`).trim().toUpperCase(),
          institutionId: oldFdr.institutionId,
          bankId: oldFdr.bankId,
          branchName: branchName || oldFdr.branchName,
          amount: amount ? parseFloat(amount) : oldFdr.amount,
          issueDate: issueDate ? new Date(issueDate) : new Date(),
          maturityDate: maturityDate ? new Date(maturityDate) : new Date(Date.now() + 36 * 30 * 86400000),
          validityMonths: 36,
          lienPledgeInFavor: oldFdr.lienPledgeInFavor,
          status: 'ACTIVE',
          verificationTier: 'CONFIRMED',
          parentFdrId: oldFdr.id,
          isRenewal: true,
          remarks: remarks || `Renewal of FDR ${oldFdr.fdrNumber}`,
        },
      });

      // 3. Link renewal in Renewal table
      await prisma.renewal.create({
        data: {
          previousFdrId: oldFdr.id,
          newFdrId: newFdr.id,
          renewalDate: new Date(),
          initiatedById: req.user!.id,
          remarks: `Renewed for next 36 months cycle. Linked to parent instrument ${oldFdr.fdrNumber}.`,
        },
      });

      await AuditService.log({
        entityType: 'FDR',
        entityId: newFdr.id,
        action: 'RENEW',
        actorId: req.user?.id,
        actorName: req.user?.fullName,
        actorRole: req.user?.role,
        ipAddress: req.ip,
        afterState: { parentFdrId: oldFdr.id, newFdrNumber: newFdr.fdrNumber },
      });

      return res.status(201).json({
        success: true,
        data: newFdr,
        message: `FDR renewed successfully. Linked to previous instrument ${oldFdr.fdrNumber}.`,
      });
    } catch (error) {
      console.error('Renew FDR error:', error);
      return res.status(500).json({ success: false, message: 'Failed to process FDR renewal' });
    }
  }

  /**
   * Scrutiny Officer adds review notes and recommendations
   */
  public static async addScrutinyNote(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { note, recommendation } = req.body;

      if (!note) return res.status(400).json({ success: false, message: 'Note text is required' });

      const scrutinyNote = await prisma.scrutinyNote.create({
        data: {
          fdrId: id,
          officerId: req.user!.id,
          note,
          recommendation: recommendation || 'NEUTRAL',
        },
      });

      await AuditService.log({
        entityType: 'FDR',
        entityId: id,
        action: 'SCRUTINY_NOTE_ADDED',
        actorId: req.user?.id,
        afterState: { note, recommendation },
      });

      return res.status(201).json({ success: true, data: scrutinyNote });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to add scrutiny note' });
    }
  }
}
