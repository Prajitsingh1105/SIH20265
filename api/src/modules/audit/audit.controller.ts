import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import { AuditService } from './audit.service';

export class AuditController {
  /**
   * Get paginated audit logs with filters
   */
  public static async getLogs(req: Request, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(10, parseInt(req.query.limit as string) || 25));
      const skip = (page - 1) * limit;

      const { entityType, action, actorRole, search } = req.query;

      const where: any = {};
      if (entityType) where.entityType = String(entityType);
      if (action) where.action = String(action);
      if (actorRole) where.actorRole = String(actorRole);

      if (search) {
        where.OR = [
          { actorName: { contains: String(search) } },
          { entityId: { contains: String(search) } },
          { action: { contains: String(search) } },
          { afterState: { contains: String(search) } },
        ];
      }

      const [total, logs] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { timestamp: 'desc' },
        }),
      ]);

      return res.json({
        success: true,
        data: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Audit get logs error:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve audit logs' });
    }
  }

  /**
   * Cryptographically verify the SHA-256 hash chain
   */
  public static async verifyChain(req: Request, res: Response) {
    try {
      const result = await AuditService.verifyChain();
      return res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Audit verification error:', error);
      return res.status(500).json({ success: false, message: 'Failed to verify audit chain integrity' });
    }
  }

  /**
   * Demo Tampering Simulator
   */
  public static async simulateTamper(req: Request, res: Response) {
    try {
      const result = await AuditService.simulateTamper();
      return res.json({
        ...result,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

  /**
   * Demo Chain Repair
   */
  public static async repairChain(req: Request, res: Response) {
    try {
      const result = await AuditService.repairChain();
      return res.json({
        ...result,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: (error as Error).message });
    }
  }
}
