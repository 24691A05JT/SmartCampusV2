import Notification from '../models/Notification.js';

/**
 * Safe In-App Notification Dispatcher
 * Dispatches an in-app notification without interrupting or throwing errors
 * into the main database transaction or caller controller.
 *
 * @param {Object} payload
 * @param {string|ObjectId} payload.recipient - User ID of the recipient
 * @param {string} payload.title - Short notification title
 * @param {string} payload.message - Informative notification message
 * @param {string} [payload.type='system'] - Notification category
 * @param {string} [payload.link=''] - Frontend navigation target link
 * @returns {Promise<Object|null>} Saved notification or null if failed
 */
export const createNotification = async ({
  recipient,
  title,
  message,
  type = 'system',
  link = ''
}) => {
  try {
    if (!recipient || !title || !message) {
      return null;
    }

    const notification = await Notification.create({
      recipient,
      title: title.trim(),
      message: message.trim(),
      type,
      link: link ? link.trim() : ''
    });

    return notification;
  } catch (error) {
    // Non-blocking: log error in non-production environments and return null
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[NotificationHelper] Failed to deliver notification:', error.message);
    }
    return null;
  }
};

export default createNotification;
