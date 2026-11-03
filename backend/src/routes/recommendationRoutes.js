import express from 'express';
import { getRecommendations } from '../controllers/recommendationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All recommendation routes require authenticated student role
router.use(protect);
router.get('/', authorize('student'), getRecommendations);

export default router;
