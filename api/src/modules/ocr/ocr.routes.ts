import { Router } from 'express';
import multer from 'multer';
import { OcrService } from './ocr.service';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.use(authenticate);

router.post('/extract', upload.single('file'), OcrService.processOcr);

export default router;
