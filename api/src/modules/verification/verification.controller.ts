import { Request, Response } from 'express';
import { VerificationService } from './verification.service';

export class VerificationController {
  /**
   * Run verification check (Mock Bank API or Manual confirmation)
   */
  public static async verifyFdr(req: Request, res: Response) {
    try {
      const { fdrId, verificationType, manualDetails } = req.body;

      if (!fdrId || !verificationType) {
        return res.status(400).json({ success: false, message: 'fdrId and verificationType are required' });
      }

      const result = await VerificationService.verifyFdr({
        fdrId,
        verifiedById: req.user!.id,
        verificationType,
        manualDetails,
      });

      return res.json({
        success: true,
        ...result,
        message: result.isMatched
          ? 'FDR verified and confirmed by Bank CBS. Trust tier updated to Confirmed (🟢).'
          : 'Bank discrepancy detected! Status changed to Resubmission Required (🔴). Institution notified.',
      });
    } catch (error) {
      console.error('Verify FDR error:', error);
      return res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

  /**
   * Get side-by-side comparison of Claimed vs Confirmed
   */
  public static async getComparison(req: Request, res: Response) {
    try {
      const { fdrId } = req.params;
      const data = await VerificationService.getComparison(fdrId);
      return res.json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, message: (error as Error).message });
    }
  }
}
