import { Request, Response } from 'express';
import { LifecycleService } from './lifecycle.service';
import { prisma } from '../../config/db';

export class LifecycleController {
  /**
   * Get current demo clock state
   */
  public static async getClockState(req: Request, res: Response) {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'demo_clock_offset_days' },
      });
      const offsetDays = setting ? parseInt(setting.value, 10) || 0 : 0;
      const simulatedDate = await LifecycleService.getEffectiveDate();

      return res.json({
        success: true,
        data: {
          offsetDays,
          simulatedDate,
          isShifted: offsetDays !== 0,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to get clock state' });
    }
  }

  /**
   * Shift demo clock forward (+30d, +60d, or custom) & trigger scan
   */
  public static async shiftClock(req: Request, res: Response) {
    try {
      const { days } = req.body;
      const offsetDays = parseInt(String(days), 10);

      if (isNaN(offsetDays)) {
        return res.status(400).json({ success: false, message: 'Valid days integer required' });
      }

      const result = await LifecycleService.setDemoClockOffset(offsetDays, req.user?.id);

      return res.json({
        success: true,
        data: result,
        message: `System date shifted by +${offsetDays} days. Simulated current date: ${result.simulatedDate.toLocaleDateString('en-IN')}. Automated maturity scan executed.`,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to shift demo clock' });
    }
  }

  /**
   * Reset demo clock to real time
   */
  public static async resetClock(req: Request, res: Response) {
    try {
      const result = await LifecycleService.resetDemoClock(req.user?.id);
      return res.json({
        success: true,
        data: result,
        message: 'Demo clock reset to actual current date.',
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to reset demo clock' });
    }
  }

  /**
   * Manually run lifecycle scan now
   */
  public static async runScanNow(req: Request, res: Response) {
    try {
      const result = await LifecycleService.runLifecycleScan(req.user?.id);
      return res.json({
        success: true,
        data: result,
        message: `Scan finished in ${result.durationMs}ms. Scanned ${result.totalScanned} FDRs. Reminders: ${result.remindersTriggered}, Matured: ${result.maturedTransitioned}, Escalated: ${result.escalationsTriggered}`,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to execute lifecycle scan' });
    }
  }

  /**
   * Get reminder and escalation rules
   */
  public static async getRules(req: Request, res: Response) {
    try {
      const [reminderRules, escalationRules] = await Promise.all([
        prisma.reminderRule.findMany({ orderBy: { daysBeforeMaturity: 'desc' } }),
        prisma.escalationRule.findMany({ orderBy: { daysOverdue: 'asc' } }),
      ]);
      return res.json({ success: true, data: { reminderRules, escalationRules } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch rules' });
    }
  }
}
