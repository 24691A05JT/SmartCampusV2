import Notification from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * @desc    Get paginated notifications for the authenticated user
 * @route   GET /api/notifications
 * @access  Private
 */
export const getMyNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = { recipient: req.user._id };

    if (req.query.isRead !== undefined) {
      query.isRead = req.query.isRead === 'true';
    }

    if (req.query.type) {
      query.type = req.query.type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: req.user._id, isRead: false })
    ]);

    return sendSuccess(
      res,
      'Notifications retrieved successfully.',
      {
        notifications,
        unreadCount
      },
      200,
      {
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        totalItems: total
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get fast unread notification count for badge hydration
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    return sendSuccess(res, 'Unread notification count retrieved.', { unreadCount });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification) {
      return sendError(res, 'Notification not found.', 404);
    }

    // Ownership check
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied: You cannot modify another user\'s notification.', 403);
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();
    }

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    return sendSuccess(res, 'Notification marked as read.', {
      notification,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all unread notifications of current user as read
 * @route   PATCH /api/notifications/mark-all-read
 * @access  Private
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    return sendSuccess(res, 'All notifications marked as read.', {
      modifiedCount: result.modifiedCount || 0,
      unreadCount: 0
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a single notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification) {
      return sendError(res, 'Notification not found.', 404);
    }

    // Ownership check
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied: You cannot delete another user\'s notification.', 403);
    }

    await Notification.findByIdAndDelete(id);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    return sendSuccess(res, 'Notification deleted successfully.', {
      id,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear all read notifications for current user
 * @route   DELETE /api/notifications/clear-read
 * @access  Private
 */
export const clearReadNotifications = async (req, res, next) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.user._id,
      isRead: true
    });

    return sendSuccess(res, 'Read notifications cleared successfully.', {
      deletedCount: result.deletedCount || 0
    });
  } catch (error) {
    next(error);
  }
};
