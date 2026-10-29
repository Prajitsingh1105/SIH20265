import { Request, Response } from 'express';
import { IntegrationsService } from './integrations.service';

export class IntegrationsController {
  /**
   * Get all external system integration statuses
   */
  public static async getIntegrations(req: Request, res: Response) {
    try {
      const integrations = await IntegrationsService.getIntegrations();
      return res.json({ success: true, data: integrations });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve integrations' });
    }
  }

  /**
   * Test connection to a specific integration
   */
  public static async testConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await IntegrationsService.testConnection(id);
      return res.json({ success: true, ...result });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Connection test failed' });
    }
  }
}
