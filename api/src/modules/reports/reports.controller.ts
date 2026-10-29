import { Request, Response } from 'express';
import { ReportsService } from './reports.service';

export class ReportsController {
  /**
   * Get dashboard analytics, charts, KPIs, and attention lists
   */
  public static async getDashboardStats(req: Request, res: Response) {
    try {
      const institutionId = req.user?.role === 'INSTITUTION' ? req.user.institutionId || undefined : undefined;
      const data = await ReportsService.getDashboardStats(institutionId);
      return res.json({ success: true, data });
    } catch (error) {
      console.error('Reports error:', error);
      return res.status(500).json({ success: false, message: 'Failed to generate dashboard statistics' });
    }
  }

  /**
   * Export FDR records as CSV
   */
  public static async exportCsv(req: Request, res: Response) {
    try {
      const filters = { ...req.query };
      if (req.user?.role === 'INSTITUTION') {
        filters.institutionId = req.user.institutionId || undefined;
      }

      const csvContent = await ReportsService.generateCsv(filters);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="AICTE_FDR_Report_${Date.now()}.csv"`);
      return res.send(csvContent);
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to export CSV report' });
    }
  }
}
