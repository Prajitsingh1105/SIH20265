import { Router } from 'express';
import multer from 'multer';
import { DocumentController } from './document.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max limit
});

router.use(authenticate);

router.post('/upload', upload.single('file'), DocumentController.uploadDocument);
router.post('/:id/version', upload.single('file'), DocumentController.uploadNewVersion);
router.get('/:id/download', DocumentController.downloadDocument);
router.get('/:id/versions', DocumentController.getVersions);
router.get('/:id/access-logs', DocumentController.getAccessLogs);
router.delete('/:id', DocumentController.deleteDocument);

export default router;
