import { getRecommendationsForStudent } from '../services/recommendationService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * @desc    Get Personalized Event Recommendations for Authenticated Student
 * @route   GET /api/recommendations
 * @access  Private (Student only)
 */
export const getRecommendations = async (req, res, next) => {
  try {
    // 1. RBAC Guard: Student-only endpoint
    if (!req.user || req.user.role !== 'student') {
      return sendError(
        res,
        `Access forbidden: Role '${req.user?.role || 'guest'}' is not authorized to access student recommendations.`,
        403
      );
    }

    const { limit, category, minScore, excludeRegistered } = req.query;

    const parsedLimit = limit !== undefined ? parseInt(limit, 10) : 6;
    const safeLimit = isNaN(parsedLimit) ? 6 : Math.min(20, Math.max(1, parsedLimit));

    const parsedMinScore = minScore !== undefined ? parseInt(minScore, 10) : 0;
    const safeMinScore = isNaN(parsedMinScore) ? 0 : Math.max(0, Math.min(100, parsedMinScore));

    const shouldExcludeRegistered = excludeRegistered !== 'false';

    const { recommendations, meta } = await getRecommendationsForStudent(req.user._id, {
      limit: safeLimit,
      category: category && category !== 'All' ? category.trim() : null,
      minScore: safeMinScore,
      excludeRegistered: shouldExcludeRegistered
    });

    return sendSuccess(
      res,
      'Recommendations retrieved successfully.',
      recommendations,
      200,
      null,
      meta
    );
  } catch (error) {
    next(error);
  }
};
