import {
  getStudentAnalytics,
  getOrganizerAnalytics,
  getAdminAnalytics
} from '../services/analyticsService.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * @desc    Get Current Student's Engagement Analytics
 * @route   GET /api/analytics/student
 * @access  Private (Student only)
 */
export const getStudentAnalyticsController = async (req, res, next) => {
  try {
    const data = await getStudentAnalytics(req.user._id);
    return sendSuccess(res, 'Student engagement analytics retrieved successfully.', data);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get Faculty & Organizer Performance Analytics
 * @route   GET /api/analytics/organizer
 * @access  Private (Organizer and Admin)
 */
export const getOrganizerAnalyticsController = async (req, res, next) => {
  try {
    const data = await getOrganizerAnalytics(req.user._id);
    return sendSuccess(res, 'Organizer performance analytics retrieved successfully.', data);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get Campus-Wide Institutional Analytics
 * @route   GET /api/analytics/admin
 * @access  Private (Admin only)
 */
export const getAdminAnalyticsController = async (req, res, next) => {
  try {
    const data = await getAdminAnalytics();
    return sendSuccess(res, 'Campus-wide institutional analytics retrieved successfully.', data);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get Role-Appropriate Dashboard Analytics (Multi-Role Dispatch)
 * @route   GET /api/analytics/dashboard
 * @access  Private (Authenticated users)
 */
export const getDashboardAnalyticsController = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    let data;

    if (userRole === 'admin') {
      data = await getAdminAnalytics();
    } else if (userRole === 'organizer') {
      data = await getOrganizerAnalytics(req.user._id);
    } else {
      data = await getStudentAnalytics(req.user._id);
    }

    return sendSuccess(res, 'Dashboard analytics retrieved successfully.', {
      role: userRole,
      ...data
    });
  } catch (err) {
    next(err);
  }
};
