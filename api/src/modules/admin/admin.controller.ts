import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import { seedDatabase } from '../../prisma/seed';
import { AuditService } from '../audit/audit.service';

export class AdminController {
  /**
   * Reset database back to original clean demo state
   */
  public static async resetDemoData(req: Request, res: Response) {
    try {
      await seedDatabase();

      if (req.user) {
        await AuditService.log({
          entityType: 'SYSTEM',
          entityId: 'DATABASE',
          action: 'DEMO_DATA_RESET',
          actorId: req.user.id,
          actorName: req.user.fullName,
          actorRole: req.user.role,
          ipAddress: req.ip,
          afterState: { message: 'Database reset to clean SIH demo seed state' },
        });
      }

      return res.json({
        success: true,
        message: 'Demo database successfully reset to original seed state with ~40 FDRs across all lifecycle statuses.',
      });
    } catch (error) {
      console.error('Reset demo data error:', error);
      return res.status(500).json({ success: false, message: 'Failed to reset demo database' });
    }
  }

  /**
   * Get all institutions
   */
  public static async getInstitutions(req: Request, res: Response) {
    try {
      const institutions = await prisma.institution.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { fdrs: true, users: true } },
        },
      });
      return res.json({ success: true, data: institutions });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch institutions' });
    }
  }

  /**
   * Get all banks
   */
  public static async getBanks(req: Request, res: Response) {
    try {
      const banks = await prisma.bank.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { fdrs: true } },
        },
      });
      return res.json({ success: true, data: banks });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch banks' });
    }
  }

  /**
   * Get all users
   */
  public static async getUsers(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        include: { role: true, institution: true },
        orderBy: { createdAt: 'desc' },
      });
      return res.json({ success: true, data: users });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
  }
}
