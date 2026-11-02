import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendError } from '../utils/apiResponse.js';

const JWT_SECRET = process.env.JWT_SECRET || 'campus_smart_jwt_dev_super_secret_key_2026_x89a';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate signed JWT Token
 */
export const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Middleware: Verify Bearer JWT and attach authenticated user to req.user
 */
export const protect = async (req, res, next) => {
  let token = null;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendError(
      res,
      'Authentication required. Please log in to access this resource.',
      401
    );
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return sendError(
        res,
        'User account associated with this token no longer exists.',
        401
      );
    }

    if (!user.isActive) {
      return sendError(
        res,
        'Your user account has been deactivated. Please contact campus administration.',
        403
      );
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Authentication token has expired. Please log in again.', 401);
    }
    return sendError(res, 'Invalid authentication token. Authorization denied.', 401);
  }
};

/**
 * Middleware: Role-Based Access Control (RBAC)
 * @param  {...string} roles - Permitted roles (e.g. 'student', 'organizer', 'admin')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required before checking permissions.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access forbidden: Role '${req.user.role}' is not authorized to perform this action.`,
        403
      );
    }

    next();
  };
};

/**
 * Middleware: Optional Authentication (attaches req.user if valid token present, passes through otherwise)
 */
export const optionalProtect = async (req, res, next) => {
  let token = null;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (err) {
    // Ignore error for optional authentication
  }

  next();
};
