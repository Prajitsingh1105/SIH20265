import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import { AuditService } from '../audit/audit.service';

export class DiscrepancyController {
  /**
   * List discrepancies with filter
   */
  public static async getFlags(req: Request, res: Response) {
    try {
      const { fdrId, isResolved, severity } = req.query;
      const where: any = {};

      if (fdrId) where.fdrId = String(fdrId);
      if (isResolved !== undefined) where.isResolved = isResolved === 'true';
      if (severity) where.severity = String(severity);

      if (req.user?.role === 'INSTITUTION') {
        where.fdr = { institutionId: req.user.institutionId };
      }

      const flags = await prisma.discrepancyFlag.findMany({
        where,
        include: {
          fdr: {
            include: {
              institution: { select: { name: true, code: true } },
              bank: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json({ success: true, data: flags });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve discrepancy flags' });
    }
  }

  /**
   * Scrutiny Officer resolves or overrides discrepancy flag with mandatory remark
   */
  public static async resolveFlag(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { resolutionRemark } = req.body;

      if (!resolutionRemark) {
        return res.status(400).json({ success: false, message: 'A mandatory resolution remark is required to resolve or override a discrepancy.' });
      }

      const flag = await prisma.discrepancyFlag.findUnique({
        where: { id },
        include: { fdr: true },
      });

      if (!flag) return res.status(404).json({ success: false, message: 'Discrepancy flag not found' });

      const updated = await prisma.discrepancyFlag.update({
        where: { id },
        data: {
          isResolved: true,
          resolvedById: req.user!.id,
          resolutionRemark,
          resolvedAt: new Date(),
        },
      });

      // Check remaining unresolved flags for this FDR
      const remainingUnresolved = await prisma.discrepancyFlag.count({
        where: { fdrId: flag.fdrId, isResolved: false },
      });

      if (remainingUnresolved === 0) {
        // If all flags cleared, restore tier
        await prisma.fDR.update({
          where: { id: flag.fdrId },
          data: {
            verificationTier: flag.fdr.status === 'VERIFIED_CONFIRMED' ? 'CONFIRMED' : 'CLAIMED',
            status: flag.fdr.status === 'DISCREPANCY_FLAGGED' ? 'UNDER_SCRUTINY' : flag.fdr.status,
          },
        });
      }

      await AuditService.log({
        entityType: 'DISCREPANCY',
        entityId: id,
        action: 'RESOLVE_FLAG',
        actorId: req.user?.id,
        actorName: req.user?.fullName,
        actorRole: req.user?.role,
        ipAddress: req.ip,
        afterState: { resolutionRemark, remainingUnresolved },
      });

      return res.json({
        success: true,
        data: updated,
        message: 'Discrepancy resolved. FDR compliance record updated.',
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to resolve discrepancy' });
    }
  }
}
