import express from 'express';
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password/:token', passwordResetLimiter, resetPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);

export default router;
