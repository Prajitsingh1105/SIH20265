import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import { StorageService } from './storage.service';
import { AuditService } from '../audit/audit.service';

export class DocumentController {
  /**
   * Upload new document to Digital Vault (encrypted AES-256)
   */
  public static async uploadDocument(req: Request, res: Response) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const { fdrId, docType, title } = req.body;

      if (!fdrId || !docType) {
        return res.status(400).json({ success: false, message: 'fdrId and docType are required' });
      }

      const fdr = await prisma.fDR.findUnique({ where: { id: fdrId } });
      if (!fdr) return res.status(404).json({ success: false, message: 'FDR not found' });

      // Check institution tenancy
      if (req.user?.role === 'INSTITUTION' && fdr.institutionId !== req.user.institutionId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      // Encrypt and store
      const upload = await StorageService.uploadEncrypted(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      const document = await prisma.fDRDocument.create({
        data: {
          fdrId,
          docType,
          title: title || file.originalname,
          fileKey: upload.fileKey,
          originalName: file.originalname,
          mimeType: file.mimetype,
          fileSize: upload.fileSize,
          checksumSha256: upload.checksum,
          isEncrypted: true,
          currentVersion: 1,
          uploadedById: req.user!.id,
        },
      });

      // Create Initial Version record
      await prisma.documentVersion.create({
        data: {
          documentId: document.id,
          version: 1,
          fileKey: upload.fileKey,
          originalName: file.originalname,
          fileSize: upload.fileSize,
          checksumSha256: upload.checksum,
          uploadedById: req.user!.id,
          changeReason: 'Initial upload',
        },
      });

      await AuditService.log({
        entityType: 'DOCUMENT',
        entityId: document.id,
        action: 'UPLOAD',
        actorId: req.user?.id,
        actorName: req.user?.fullName,
        actorRole: req.user?.role,
        ipAddress: req.ip,
        afterState: { title: document.title, docType: document.docType, checksum: upload.checksum },
      });

      return res.status(201).json({
        success: true,
        data: document,
        message: 'Document encrypted and saved to Digital Vault.',
      });
    } catch (error) {
      console.error('Document upload error:', error);
      return res.status(500).json({ success: false, message: 'Failed to upload document' });
    }
  }

  /**
   * Upload new Version of an existing document (v2, v3...)
   */
  public static async uploadNewVersion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const file = req.file;
      const { changeReason } = req.body;

      if (!file) return res.status(400).json({ success: false, message: 'No file provided' });

      const existingDoc = await prisma.fDRDocument.findUnique({
        where: { id },
        include: { fdr: true },
      });

      if (!existingDoc) return res.status(404).json({ success: false, message: 'Document not found' });

      if (req.user?.role === 'INSTITUTION' && existingDoc.fdr.institutionId !== req.user.institutionId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      const nextVersion = existingDoc.currentVersion + 1;

      // Encrypt and store new version
      const upload = await StorageService.uploadEncrypted(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      // Create Version row
      const versionRecord = await prisma.documentVersion.create({
        data: {
          documentId: existingDoc.id,
          version: nextVersion,
          fileKey: upload.fileKey,
          originalName: file.originalname,
          fileSize: upload.fileSize,
          checksumSha256: upload.checksum,
          uploadedById: req.user!.id,
          changeReason: changeReason || `Updated to version ${nextVersion}`,
        },
      });

      // Update parent document pointer
      const updatedDoc = await prisma.fDRDocument.update({
        where: { id },
        data: {
          fileKey: upload.fileKey,
          originalName: file.originalname,
          mimeType: file.mimetype,
          fileSize: upload.fileSize,
          checksumSha256: upload.checksum,
          currentVersion: nextVersion,
        },
      });

      await AuditService.log({
        entityType: 'DOCUMENT',
        entityId: existingDoc.id,
        action: 'VERSION_UPDATE',
        actorId: req.user?.id,
        actorName: req.user?.fullName,
        actorRole: req.user?.role,
        ipAddress: req.ip,
        afterState: { version: nextVersion, changeReason },
      });

      return res.json({
        success: true,
        data: updatedDoc,
        version: versionRecord,
        message: `Document updated to Version ${nextVersion}. Prior versions preserved in vault history.`,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to upload document version' });
    }
  }

  /**
   * Download and decrypt document on-the-fly with audit logging
   */
  public static async downloadDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { version } = req.query;

      const doc = await prisma.fDRDocument.findUnique({
        where: { id },
        include: { fdr: true },
      });

      if (!doc || doc.isDeleted) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }

      if (req.user?.role === 'INSTITUTION' && doc.fdr.institutionId !== req.user.institutionId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      let targetFileKey = doc.fileKey;
      let targetName = doc.originalName;

      if (version) {
        const verNum = parseInt(String(version), 10);
        const specificVer = await prisma.documentVersion.findFirst({
          where: { documentId: doc.id, version: verNum },
        });
        if (specificVer) {
          targetFileKey = specificVer.fileKey;
          targetName = specificVer.originalName;
        }
      }

      // Decrypt
      const decryptedBuffer = await StorageService.getDecrypted(targetFileKey);

      // Record in DocumentAccessLog
      await prisma.documentAccessLog.create({
        data: {
          documentId: doc.id,
          userId: req.user!.id,
          accessType: 'DOWNLOAD',
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      // Audit log
      await AuditService.log({
        entityType: 'DOCUMENT',
        entityId: doc.id,
        action: 'DOWNLOAD',
        actorId: req.user?.id,
        actorName: req.user?.fullName,
        actorRole: req.user?.role,
        ipAddress: req.ip,
        afterState: { originalName: targetName, version: version || doc.currentVersion },
      });

      res.setHeader('Content-Type', doc.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${targetName}"`);
      res.setHeader('Content-Length', decryptedBuffer.length);
      return res.send(decryptedBuffer);
    } catch (error) {
      console.error('Download document error:', error);
      return res.status(500).json({ success: false, message: 'Failed to decrypt and retrieve document' });
    }
  }

  /**
   * Get version history for a document
   */
  public static async getVersions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const versions = await prisma.documentVersion.findMany({
        where: { documentId: id },
        orderBy: { version: 'desc' },
      });
      return res.json({ success: true, data: versions });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve version history' });
    }
  }

  /**
   * Get document access logs
   */
  public static async getAccessLogs(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const logs = await prisma.documentAccessLog.findMany({
        where: { documentId: id },
        include: { user: { select: { fullName: true, designation: true } } },
        orderBy: { accessedAt: 'desc' },
      });
      return res.json({ success: true, data: logs });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve access logs' });
    }
  }

  /**
   * Soft-delete document
   */
  public static async deleteDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const doc = await prisma.fDRDocument.findUnique({
        where: { id },
        include: { fdr: true },
      });

      if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

      if (req.user?.role === 'INSTITUTION' && doc.fdr.institutionId !== req.user.institutionId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      await prisma.fDRDocument.update({
        where: { id },
        data: { isDeleted: true },
      });

      await AuditService.log({
        entityType: 'DOCUMENT',
        entityId: doc.id,
        action: 'DELETE',
        actorId: req.user?.id,
        ipAddress: req.ip,
      });

      return res.json({ success: true, message: 'Document archived (soft-deleted).' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to delete document' });
    }
  }
}
