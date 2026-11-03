import Event from '../models/Event.js';
import User from '../models/User.js';
import Registration from '../models/Registration.js';
import Attendance from '../models/Attendance.js';
import Feedback from '../models/Feedback.js';

/**
 * Determine if an event date + end time has already elapsed
 * @param {Date|string} eventDate
 * @param {string} [endTime] - "HH:mm"
 * @returns {boolean}
 */
export const isEventInPast = (eventDate, endTime) => {
  const now = new Date();
  const eventDateTime = new Date(eventDate);

  if (endTime && /^([01]\d|2[0-3]):([0-5]\d)$/.test(endTime)) {
    const [hours, minutes] = endTime.split(':').map(Number);
    eventDateTime.setHours(hours, minutes, 0, 0);
  } else {
    eventDateTime.setHours(23, 59, 59, 999);
  }

  return now > eventDateTime;
};

/**
 * Determine if an event's registration deadline has passed
 * @param {Date|string} deadline
 * @returns {boolean}
 */
export const isDeadlineExpired = (deadline) => {
  if (!deadline) return false;
  return new Date() > new Date(deadline);
};

/**
 * Check if event has reached maximum capacity
 * @param {object} event
 * @returns {boolean}
 */
export const isEventFull = (event) => {
  return (event.registeredCount || 0) >= (event.capacity || 0);
};

/**
 * Check if student department satisfies target department requirement
 * @param {string} eventDept
 * @param {string} studentDept
 * @returns {boolean}
 */
export const isDepartmentEligible = (eventDept, studentDept) => {
  if (!eventDept || eventDept.trim().toLowerCase() === 'all') {
    return true;
  }
  return eventDept.trim().toLowerCase() === (studentDept || '').trim().toLowerCase();
};

/**
 * Check if student academic year satisfies target year requirement
 * @param {number[]} eventYears
 * @param {number} studentYear
 * @returns {boolean}
 */
export const isYearEligible = (eventYears, studentYear) => {
  if (!Array.isArray(eventYears) || eventYears.length === 0) {
    return true; // Open to all academic years
  }
  return Boolean(studentYear && eventYears.includes(Number(studentYear)));
};

/**
 * Calculate multi-factor recommendation score (0-100) and explainable reasons
 * @param {object} student
 * @param {object} event
 * @param {object} studentHistory
 * @returns {{ score: number, reasons: string[], availableSeats: number, isFull: boolean, isRegistered: boolean }}
 */
export const calculateEventRecommendation = (student, event, studentHistory = {}) => {
  const reasons = [];

  // 1. Interest & Category Match Factor (Max 30 pts)
  let interestScore = 0;
  const rawInterests = (student.interests || []).map((i) => i.trim()).filter(Boolean);
  const eventCategory = (event.category || '').trim().toLowerCase();
  const eventTags = (event.tags || []).map((t) => t.trim().toLowerCase()).filter(Boolean);
  const eventTitle = (event.title || '').toLowerCase();
  const eventDesc = (event.description || '').toLowerCase();

  const matchedInterests = [];

  for (const rawInterest of rawInterests) {
    const interest = rawInterest.toLowerCase();
    let matched = false;

    // Check category match
    if (interest === eventCategory || eventCategory.includes(interest) || interest.includes(eventCategory)) {
      interestScore += matchedInterests.length === 0 ? 20 : 10;
      matched = true;
    }
    // Check tags match
    else if (eventTags.some((tag) => tag === interest || tag.includes(interest) || interest.includes(tag))) {
      interestScore += matchedInterests.length === 0 ? 20 : 10;
      matched = true;
    }
    // Check title / description keywords
    else if (eventTitle.includes(interest) || eventDesc.includes(interest)) {
      interestScore += 5;
      matched = true;
    }

    if (matched && !matchedInterests.includes(rawInterest)) {
      matchedInterests.push(rawInterest);
    }
  }

  // Cap interest score strictly at 30
  interestScore = Math.min(30, interestScore);

  if (matchedInterests.length > 0) {
    const formattedInterests = matchedInterests.slice(0, 2).map((i) => `'${i}'`).join(', ');
    reasons.push(`Matches your interest in ${formattedInterests}`);
  }

  // 2. Department Relevance (Max 25 pts)
  let deptScore = 0;
  const studentDept = (student.department || '').trim().toLowerCase();
  const eventDept = (event.targetDepartment || 'All').trim().toLowerCase();

  if (eventDept !== 'all' && eventDept === studentDept) {
    deptScore = 25;
    reasons.push(`Matches your ${student.department} curriculum`);
  } else if (eventDept === 'all') {
    deptScore = 15;
    reasons.push('Open campus-wide to all academic departments');
  }
  deptScore = Math.min(25, deptScore);

  // 3. Academic Year Relevance (Max 15 pts)
  let yearScore = 0;
  const eventYears = Array.isArray(event.targetYear) ? event.targetYear : [];

  if (eventYears.length > 0 && eventYears.includes(Number(student.year))) {
    yearScore = 15;
    reasons.push(`Specifically recommended for Year ${student.year} students`);
  } else if (eventYears.length === 0) {
    yearScore = 12;
    reasons.push('Open to all academic years');
  }
  yearScore = Math.min(15, yearScore);

  // 4. Skills & Tag Overlap (Max 15 pts)
  let skillScore = 0;
  const rawSkills = (student.skills || []).map((s) => s.trim()).filter(Boolean);
  const matchedSkills = [];

  for (const rawSkill of rawSkills) {
    const skill = rawSkill.toLowerCase();
    let matched = false;

    if (eventTags.some((tag) => tag === skill || tag.includes(skill) || skill.includes(tag))) {
      skillScore += matchedSkills.length === 0 ? 10 : 5;
      matched = true;
    } else if (eventTitle.includes(skill) || eventDesc.includes(skill)) {
      skillScore += 5;
      matched = true;
    }

    if (matched && !matchedSkills.includes(rawSkill)) {
      matchedSkills.push(rawSkill);
    }
  }

  skillScore = Math.min(15, skillScore);
  if (matchedSkills.length > 0) {
    reasons.push(`Aligns with your skills in ${matchedSkills.slice(0, 3).join(', ')}`);
  }

  // 5. Behavioral: Attendance & Feedback Affinity (Max 10 pts)
  let behaviorScore = 0;
  const attendedCategories = studentHistory.attendedCategories || new Set();
  const highRatedCategories = studentHistory.highRatedCategories || new Set();

  if (attendedCategories.has(eventCategory)) {
    behaviorScore += 6;
    reasons.push(`Similar to ${event.category} events you previously attended`);
  }

  if (highRatedCategories.has(eventCategory)) {
    behaviorScore += 4;
    reasons.push(`Matches event categories you previously rated 4★ or higher`);
  }

  behaviorScore = Math.min(10, behaviorScore);

  // 6. Popularity / Occupancy (Max 5 pts)
  let popScore = 1;
  const capacity = Math.max(1, event.capacity || 1);
  const registered = event.registeredCount || 0;
  const occupancy = registered / capacity;
  const availableSeats = Math.max(0, capacity - registered);

  if (occupancy >= 0.5) {
    popScore = 5;
    reasons.push(`High campus interest (${availableSeats} seats remaining)`);
  } else if (occupancy >= 0.2) {
    popScore = 3;
    reasons.push(`Popular on campus (${registered} students enrolled)`);
  } else {
    popScore = 1;
  }
  popScore = Math.min(5, popScore);

  // Final 0–100 Score Calculation
  const totalRawScore = interestScore + deptScore + yearScore + skillScore + behaviorScore + popScore;
  const finalScore = Math.max(0, Math.min(100, Math.round(totalRawScore)));

  const isRegistered = studentHistory.confirmedEventIds
    ? studentHistory.confirmedEventIds.has(event._id.toString())
    : false;

  return {
    score: finalScore,
    reasons,
    availableSeats,
    isFull: availableSeats === 0,
    isRegistered
  };
};

/**
 * Get personalized event recommendations for an authenticated student
 * @param {string|mongoose.Types.ObjectId} studentId
 * @param {object} options
 * @param {number} [options.limit=6]
 * @param {string} [options.category]
 * @param {number} [options.minScore=0]
 * @param {boolean} [options.excludeRegistered=true]
 * @returns {Promise<{ recommendations: object[], meta: object }>}
 */
export const getRecommendationsForStudent = async (studentId, options = {}) => {
  const {
    limit = 6,
    category = null,
    minScore = 0,
    excludeRegistered = true
  } = options;

  const student = await User.findById(studentId).lean();
  if (!student) {
    throw new Error('Student account not found.');
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Concurrent retrieval of candidate events and student historical behavior
  const [candidateEvents, confirmedRegistrations, pastAttendance, highFeedback] = await Promise.all([
    Event.find({
      status: 'approved',
      isCancelled: false,
      date: { $gte: startOfToday }
    })
      .populate('organizer', 'name email department avatar')
      .lean(),
    Registration.find({
      student: studentId,
      status: 'confirmed'
    })
      .select('event')
      .lean(),
    Attendance.find({
      student: studentId,
      status: 'present'
    })
      .populate('event', 'category tags')
      .lean(),
    Feedback.find({
      student: studentId,
      rating: { $gte: 4 }
    })
      .populate('event', 'category')
      .lean()
  ]);

  // Construct historical behavior lookups for O(1) matching
  const confirmedEventIds = new Set(
    confirmedRegistrations.map((r) => (r.event ? r.event.toString() : ''))
  );

  const attendedCategories = new Set(
    pastAttendance
      .map((a) => (a.event?.category ? a.event.category.toLowerCase() : ''))
      .filter(Boolean)
  );

  const highRatedCategories = new Set(
    highFeedback
      .map((f) => (f.event?.category ? f.event.category.toLowerCase() : ''))
      .filter(Boolean)
  );

  const studentHistory = {
    confirmedEventIds,
    attendedCategories,
    highRatedCategories
  };

  // Strict Eligibility Filtering
  const eligibleEvents = candidateEvents.filter((event) => {
    // 1. Must be approved and uncancelled
    if (event.status !== 'approved' || event.isCancelled) return false;

    // 2. Must not be in the past
    if (isEventInPast(event.date, event.endTime)) return false;

    // 3. Registration deadline must not have passed
    if (isDeadlineExpired(event.registrationDeadline)) return false;

    // 4. Must not be full
    if (isEventFull(event)) return false;

    // 5. Must satisfy department eligibility
    if (!isDepartmentEligible(event.targetDepartment, student.department)) return false;

    // 6. Must satisfy year eligibility
    if (!isYearEligible(event.targetYear, student.year)) return false;

    // 7. Optional Category Filter
    if (category && category !== 'All' && event.category !== category) return false;

    // 8. Exclusion of already registered events if requested
    if (excludeRegistered && confirmedEventIds.has(event._id.toString())) return false;

    return true;
  });

  // Calculate scores and explainable reasons for all eligible events
  const scoredItems = eligibleEvents
    .map((event) => {
      const calculation = calculateEventRecommendation(student, event, studentHistory);
      return {
        event,
        score: calculation.score,
        reasons: calculation.reasons,
        availableSeats: calculation.availableSeats,
        isFull: calculation.isFull,
        isRegistered: calculation.isRegistered
      };
    })
    .filter((item) => item.score >= minScore);

  // Sort descending by recommendation score, tie-break by earlier date
  scoredItems.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return new Date(a.event.date) - new Date(b.event.date);
  });

  // Apply requested limit
  const maxLimit = Math.min(20, Math.max(1, limit));
  const recommendations = scoredItems.slice(0, maxLimit);

  const userInterests = student.interests || [];
  const userSkills = student.skills || [];

  const meta = {
    totalEligible: eligibleEvents.length,
    returnedCount: recommendations.length,
    hasInterests: userInterests.length > 0,
    hasSkills: userSkills.length > 0,
    profileIncomplete: userInterests.length === 0 || userSkills.length === 0
  };

  return {
    recommendations,
    meta
  };
};
