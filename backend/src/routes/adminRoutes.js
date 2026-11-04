import express from 'express';
import {
  getAdminDashboardSummary,
  getUsersAdmin,
  getUserDetailAdmin,
  updateUserStatusAdmin,
  getAuditLogsAdmin,
  getRegistrationsAdmin,
  cancelRegistrationAdmin,
  cancelEventAdmin
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Enforce strict authentication and administrative RBAC across all routes
router.use(protect, authorize('admin'));

// 1. Dashboard Overview
router.get('/dashboard', getAdminDashboardSummary);

// 2. User Governance
router.get('/users', getUsersAdmin);
router.get('/users/:id', getUserDetailAdmin);
router.patch('/users/:id/status', updateUserStatusAdmin);

// 3. Institutional Audit Trail Center
router.get('/audit-logs', getAuditLogsAdmin);

// 4. Registration Governance
router.get('/registrations', getRegistrationsAdmin);
router.patch('/registrations/:id/cancel', cancelRegistrationAdmin);

// 5. Event Governance
router.patch('/events/:id/cancel', cancelEventAdmin);

export default router;
