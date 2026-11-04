import express from 'express';
import {
  getMyCertificates,
  getEligibleCertificates,
  getCertificateById,
  downloadCertificatePDF,
  generateSingleCertificateController,
  generateBatchCertificatesController,
  getEventCertificatesController,
  getAdminCertificatesController,
  revokeCertificateController,
  reinstateCertificateController,
  verifyCertificateController
} from '../controllers/certificateController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// 1. Public Verification Route (No authentication required)
router.get('/verify/:certificateId', verifyCertificateController);

// All subsequent routes require valid JWT authentication
router.use(protect);

// 2. Student Routes
router.get('/my-certificates', authorize('student'), getMyCertificates);
router.get('/eligible', authorize('student'), getEligibleCertificates);

// 3. Organizer & Admin Issuance Routes
router.post('/generate/single', authorize('organizer', 'admin'), generateSingleCertificateController);
router.post('/generate/batch/:eventId', authorize('organizer', 'admin'), generateBatchCertificatesController);
router.get('/event/:eventId', authorize('organizer', 'admin'), getEventCertificatesController);

// 4. Admin Management & Revocation Routes
router.get('/admin/all', authorize('admin'), getAdminCertificatesController);
router.patch('/:id/revoke', authorize('admin'), revokeCertificateController);
router.patch('/:id/reinstate', authorize('admin'), reinstateCertificateController);

// 5. General Download & Detail Routes
router.get('/:id/download', downloadCertificatePDF);
router.get('/:id', getCertificateById);

export default router;
