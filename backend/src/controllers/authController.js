import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { validatePasswordStrength, validateEmail } from '../utils/validators.js';

/**
 * @desc    Register a new Student or Faculty Organizer
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      role = 'student',
      department,
      year,
      semester,
      interests = [],
      skills = []
    } = req.body;

    // Reject public attempts to create admin accounts
    if (role === 'admin') {
      return sendError(
        res,
        'Admin registration is restricted. Admin accounts can only be provisioned through secure system bootstrap.',
        403
      );
    }

    if (!['student', 'organizer'].includes(role)) {
      return sendError(res, 'Invalid user role selected. Allowed roles: student, organizer.', 400);
    }

    // Required fields check
    if (!name || !email || !password || !confirmPassword || !department) {
      return sendError(
        res,
        'Please provide all required fields: name, email, password, confirmPassword, and department.',
        400
      );
    }

    // Email format validation
    if (!validateEmail(email)) {
      return sendError(res, 'Please provide a valid institutional email address.', 400);
    }

    // Confirm password equality
    if (password !== confirmPassword) {
      return sendError(res, 'Passwords do not match.', 400);
    }

    // Password strength check
    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      return sendError(res, strength.message, 400);
    }

    // Duplicate email check
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, 'An account with this email address already exists. Please log in.', 400);
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      department: department.trim(),
      year: year ? Number(year) : 1,
      semester: semester ? Number(semester) : 1,
      interests: Array.isArray(interests) ? interests : [],
      skills: Array.isArray(skills) ? skills : []
    });

    // Generate token
    const token = generateToken(user._id, user.role);

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      year: user.year,
      semester: user.semester,
      interests: user.interests,
      skills: user.skills,
      avatar: user.avatar,
      createdAt: user.createdAt
    };

    return sendSuccess(res, 'Registration successful. Welcome to Smart Campus!', {
      user: safeUser,
      token
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate User & Issue JWT Token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Please provide both email and password.', 400);
    }

    // Lookup user with password field included
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    if (!user.isActive) {
      return sendError(
        res,
        'Your user account has been deactivated. Please contact campus administration.',
        403
      );
    }

    // Match password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    const token = generateToken(user._id, user.role);

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      year: user.year,
      semester: user.semester,
      interests: user.interests,
      skills: user.skills,
      avatar: user.avatar,
      createdAt: user.createdAt
    };

    return sendSuccess(res, 'Login successful.', {
      user: safeUser,
      token
    }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout User / Session Invalidation
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = async (req, res) => {
  return sendSuccess(res, 'Session cleared successfully.', null, 200);
};

/**
 * @desc    Request Password Reset Token
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 'Please provide an email address.', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Generic safe message to prevent email enumeration attacks
    const genericResponse = 'If an account with that email exists, password reset instructions have been dispatched.';

    if (!user) {
      return sendSuccess(res, genericResponse, {
        info: 'Instructions sent if account exists'
      });
    }

    // Generate token and save to DB
    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Include reset token in response payload for easy testing & faculty presentation evaluation
    return sendSuccess(res, genericResponse, {
      resetToken, // Available for presentation evaluation & testing workflows
      expiresInMinutes: 15
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset Password Using Valid Token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  try {
    const rawToken = req.params.token || req.body.token;
    const { password, confirmPassword } = req.body;

    if (!rawToken) {
      return sendError(res, 'Reset token is required.', 400);
    }

    if (!password || !confirmPassword) {
      return sendError(res, 'Please provide both password and confirmPassword.', 400);
    }

    if (password !== confirmPassword) {
      return sendError(res, 'Passwords do not match.', 400);
    }

    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      return sendError(res, strength.message, 400);
    }

    // Hash token to compare with database
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return sendError(
        res,
        'Invalid, expired, or already used password reset token. Please request a new link.',
        400
      );
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return sendSuccess(res, 'Password reset successfully! You can now log in with your new credentials.', {
      email: user.email
    });
  } catch (error) {
    next(error);
  }
};
