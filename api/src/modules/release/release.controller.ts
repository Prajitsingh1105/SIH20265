import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import { ReleaseService } from './release.service';
import { StorageService } from '../documents/storage.service';

export class ReleaseController {
  /**
   * Run automated eligibility checks for an FDR
   */
  public static async checkEligibility(req: Request, res: Response) {
    try {
      const { fdrId } = req.params;
      const eligibility = await ReleaseService.evaluateEligibility(fdrId);
      return res.json({ success: true, data: eligibility });
    } catch (error) {
      return res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

  /**
   * Institution initiates a release/refund request
   */
  public static async createRequest(req: Request, res: Response) {
    try {
      const { fdrId, reason, bankAccountNumber, bankIfsc, bankAccountName } = req.body;

      if (!fdrId || !reason || !bankAccountNumber || !bankIfsc || !bankAccountName) {
        return res.status(400).json({ success: false, message: 'All release request fields are required' });
      }

      const request = await ReleaseService.createRequest(
        fdrId,
        req.user!.institutionId!,
        req.user!.id,
        {
          reason,
          bankAccountNumber,
          bankIfsc,
          bankAccountName,
        }
      );

      return res.status(201).json({
        success: true,
        data: request,
        message: 'Release and refund request submitted successfully. Forwarded to AICTE Scrutiny Officer.',
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

  /**
   * List release requests
   */
  public static async getRequests(req: Request, res: Response) {
    try {
      const where: any = {};
      if (req.user?.role === 'INSTITUTION') {
        where.institutionId = req.user.institutionId;
      }

      const requests = await prisma.releaseRequest.findMany({
        where,
        include: {
          fdr: {
            include: { bank: true, institution: true },
          },
          institution: true,
          stages: {
            orderBy: { timestamp: 'desc' },
            include: { actor: { select: { fullName: true, designation: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json({ success: true, data: requests });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve release requests' });
    }
  }

  /**
   * Get single release request detail
   */
  public static async getRequestById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const request = await prisma.releaseRequest.findUnique({
        where: { id },
        include: {
          fdr: {
            include: {
              bank: true,
              institution: true,
              documents: { where: { isDeleted: false } },
            },
          },
          institution: true,
          stages: {
            orderBy: { timestamp: 'asc' },
            include: { actor: { select: { fullName: true, designation: true, role: true } } },
          },
        },
      });

      if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

      if (req.user?.role === 'INSTITUTION' && request.institutionId !== req.user.institutionId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      return res.json({ success: true, data: request });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch release request' });
    }
  }

  /**
   * Scrutiny Officer review
   */
  public static async scrutinize(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { action, observations } = req.body;

      if (!action || !observations) {
        return res.status(400).json({ success: false, message: 'Action and mandatory observations are required' });
      }

      const result = await ReleaseService.scrutinize(id, req.user!.id, action, observations);
      return res.json({
        ...result,
        message: action === 'SCRUTINIZED_FORWARD'
          ? 'Request recommended and forwarded to Competent Authority for final approval.'
          : 'Request updated as per scrutiny observation.',
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

  /**
   * Competent Authority approval decision
   */
  public static async authorityDecision(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { action, observations } = req.body;

      if (!action) {
        return res.status(400).json({ success: false, message: 'Decision action is required' });
      }

      const result = await ReleaseService.authorityDecision(id, req.user!.id, action, observations || '');
      return res.json({
        ...result,
        message: action === 'AUTHORITY_APPROVE'
          ? 'Release order officially approved and digitally signed. Release Order PDF generated with QR code.'
          : 'Request decision recorded.',
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

  /**
   * Download release order PDF by orderNumber or docId
   */
  public static async downloadOrder(req: Request, res: Response) {
    try {
      const { orderNumber } = req.params;

      const doc = await prisma.fDRDocument.findFirst({
        where: {
          docType: 'RELEASE_ORDER',
          title: { contains: orderNumber },
        },
      });

      if (!doc) {
        return res.status(404).json({ success: false, message: 'Release order document not found' });
      }

      const decrypted = await StorageService.getDecrypted(doc.fileKey);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${doc.originalName}"`);
      return res.send(decrypted);
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve release order PDF' });
    }
  }
}
