import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';
import { sendSuccess } from '../utils/apiResponse.js';

const router = express.Router();

// User Profile routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// RBAC validation route (for testing and administrative access verification)
router.get('/admin-only', protect, authorize('admin'), (req, res) => {
  return sendSuccess(res, 'Admin privileges verified successfully', {
    admin: req.user.name,
    role: req.user.role
  });
});

export default router;
