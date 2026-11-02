import Event from '../models/Event.js';

/**
 * Convert 24-hr time string "HH:mm" to total minutes from midnight
 * @param {string} timeStr - Time string formatted as "HH:mm"
 * @returns {number} Minutes from midnight (0 to 1439)
 */
export const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

/**
 * Detect schedule and venue conflicts between events
 * Rule: For two events at the same venue on the same date:
 * max(Start_A, Start_B) < min(End_A, End_B) determines overlapping schedule conflict.
 *
 * @param {object} params
 * @param {string} params.venue - Name of the venue
 * @param {Date|string} params.date - Date of the proposed event
 * @param {string} params.startTime - Start time "HH:mm"
 * @param {string} params.endTime - End time "HH:mm"
 * @param {string} [params.excludeEventId] - Event ID to exclude (when updating)
 * @returns {Promise<{ hasConflict: boolean, conflictingEvent?: object, message?: string }>}
 */
export const checkVenueConflict = async ({
  venue,
  date,
  startTime,
  endTime,
  excludeEventId = null
}) => {
  if (!venue || !date || !startTime || !endTime) {
    return { hasConflict: false };
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (startMinutes >= endMinutes) {
    return {
      hasConflict: true,
      message: 'Start time must be strictly earlier than end time.'
    };
  }

  // Define full day window for the given date
  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Escape regex special characters so venue names with parentheses or symbols match correctly
  const escapedVenue = venue.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Find all approved or pending events at the exact same venue on the same day
  const query = {
    venue: new RegExp(`^${escapedVenue}$`, 'i'),
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['approved', 'pending'] },
    isCancelled: false
  };

  if (excludeEventId) {
    query._id = { $ne: excludeEventId };
  }

  const potentialConflicts = await Event.find(query).populate('organizer', 'name email department');

  for (const existingEvent of potentialConflicts) {
    const existingStart = timeToMinutes(existingEvent.startTime);
    const existingEnd = timeToMinutes(existingEvent.endTime);

    // Overlap condition: max(Start_A, Start_B) < min(End_A, End_B)
    const overlapStart = Math.max(startMinutes, existingStart);
    const overlapEnd = Math.min(endMinutes, existingEnd);

    if (overlapStart < overlapEnd) {
      const statusLabel = existingEvent.status === 'approved' ? 'Confirmed Booking' : 'Pending Administrative Review';
      return {
        hasConflict: true,
        conflictingEvent: existingEvent,
        message: `Venue Conflict: '${venue}' is already booked for '${existingEvent.title}' on ${targetDate.toISOString().split('T')[0]} from ${existingEvent.startTime} to ${existingEvent.endTime} (${statusLabel}).`
      };
    }
  }

  return {
    hasConflict: false,
    message: 'Venue is available. No overlapping schedule conflicts detected.'
  };
};
