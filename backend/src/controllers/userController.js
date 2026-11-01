import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { validatePasswordStrength } from '../utils/validators.js';

/**
 * @desc    Get Authenticated User Profile
 * @route   GET /api/users/profile
 * @access  Private (Authenticated)
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, 'Profile retrieved successfully', user);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Authenticated User Profile Information
 * @route   PUT /api/users/profile
 * @access  Private (Authenticated)
 */
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const {
      name,
      department,
      year,
      semester,
      interests,
      skills,
      avatar
    } = req.body;

    if (name) user.name = name.trim();
    if (department) user.department = department.trim();
    if (year !== undefined) user.year = Number(year);
    if (semester !== undefined) user.semester = Number(semester);
    if (interests && Array.isArray(interests)) user.interests = interests;
    if (skills && Array.isArray(skills)) user.skills = skills;
    if (avatar !== undefined) user.avatar = avatar;

    const updatedUser = await user.save();

    return sendSuccess(res, 'Profile updated successfully', {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      department: updatedUser.department,
      year: updatedUser.year,
      semester: updatedUser.semester,
      interests: updatedUser.interests,
      skills: updatedUser.skills,
      avatar: updatedUser.avatar,
      updatedAt: updatedUser.updatedAt
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change Password for Authenticated User
 * @route   PUT /api/users/change-password
 * @access  Private (Authenticated)
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return sendError(
        res,
        'Please provide currentPassword, newPassword, and confirmPassword.',
        400
      );
    }

    if (newPassword !== confirmPassword) {
      return sendError(res, 'New passwords do not match.', 400);
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.isValid) {
      return sendError(res, strength.message, 400);
    }

    // Lookup user with password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return sendError(res, 'Incorrect current password.', 401);
    }

    // Update to new password
    user.password = newPassword;
    await user.save();

    return sendSuccess(res, 'Password changed successfully! Please use your new password next time.');
  } catch (error) {
    next(error);
  }
};
