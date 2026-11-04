import mongoose from 'mongoose';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Attendance from '../models/Attendance.js';
import Feedback from '../models/Feedback.js';
import Certificate from '../models/Certificate.js';

/**
 * Generate 6-month timeline intervals ending with current month
 * @returns {Array<{label: string, key: string, startDate: Date, endDate: Date}>}
 */
export const getLast6Months = () => {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const label = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    months.push({
      label,
      year,
      key: `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      startDate: monthStart,
      endDate: monthEnd
    });
  }
  return months;
};

/**
 * Fetch Student Personal Engagement Analytics
 * @param {string|mongoose.Types.ObjectId} studentId
 */
export const getStudentAnalytics = async (studentId) => {
  const studentObjId = new mongoose.Types.ObjectId(studentId);

  // 1. Basic Registration & Certificate Counts
  const [
    confirmedRegistrationsCount,
    cancelledRegistrationsCount,
    certificatesCount
  ] = await Promise.all([
    Registration.countDocuments({ student: studentObjId, status: 'confirmed' }),
    Registration.countDocuments({ student: studentObjId, status: 'cancelled' }),
    Certificate.countDocuments({ student: studentObjId, status: 'valid' })
  ]);

  // 2. Attendance Stats
  const attendanceRecords = await Attendance.find({ student: studentObjId }).lean();
  const eventsAttended = attendanceRecords.filter((a) => a.status === 'present').length;
  const eventsAbsent = attendanceRecords.filter((a) => a.status === 'absent').length;
  const totalMarked = eventsAttended + eventsAbsent;
  const attendanceRate = totalMarked > 0 ? Math.round((eventsAttended / totalMarked) * 100) : 0;

  // 3. Feedback Stats
  const feedbackStats = await Feedback.aggregate([
    { $match: { student: studentObjId } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  const averageRatingGiven = feedbackStats.length > 0 && feedbackStats[0].avgRating
    ? Math.round(feedbackStats[0].avgRating * 10) / 10
    : 0;
  const reviewsSubmitted = feedbackStats.length > 0 ? feedbackStats[0].totalReviews : 0;

  // 4. Category Participation Distribution
  const categoryAgg = await Registration.aggregate([
    { $match: { student: studentObjId, status: 'confirmed' } },
    {
      $lookup: {
        from: 'events',
        localField: 'event',
        foreignField: '_id',
        as: 'eventData'
      }
    },
    { $unwind: '$eventData' },
    {
      $group: {
        _id: '$eventData.category',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const totalCategoryRegistrations = categoryAgg.reduce((acc, curr) => acc + curr.count, 0);
  const categoryDistribution = categoryAgg.map((item) => ({
    name: item._id || 'Other',
    count: item.count,
    percentage: totalCategoryRegistrations > 0
      ? Math.round((item.count / totalCategoryRegistrations) * 100)
      : 0
  }));

  // 5. Monthly Timeline Activity (Past 6 months)
  const monthIntervals = getLast6Months();
  const sixMonthsAgo = monthIntervals[0].startDate;

  const [recentRegistrations, recentAttendances] = await Promise.all([
    Registration.find({
      student: studentObjId,
      status: 'confirmed',
      createdAt: { $gte: sixMonthsAgo }
    }).select('createdAt registrationDate').lean(),
    Attendance.find({
      student: studentObjId,
      markedAt: { $gte: sixMonthsAgo }
    }).select('markedAt status').lean()
  ]);

  const monthlyActivity = monthIntervals.map((interval) => {
    const regCount = recentRegistrations.filter((r) => {
      const regDate = new Date(r.registrationDate || r.createdAt);
      return regDate >= interval.startDate && regDate <= interval.endDate;
    }).length;

    const attCount = recentAttendances.filter((a) => {
      const attDate = new Date(a.markedAt);
      return a.status === 'present' && attDate >= interval.startDate && attDate <= interval.endDate;
    }).length;

    return {
      month: interval.label,
      key: interval.key,
      registrations: regCount,
      attended: attCount
    };
  });

  // 6. Recent Participation Items (Up to 5)
  const recentRegs = await Registration.find({ student: studentObjId, status: 'confirmed' })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate({
      path: 'event',
      select: 'title category date startTime endTime venue bannerImage status'
    })
    .lean();

  const recentEventIds = recentRegs.map((r) => r.event?._id).filter(Boolean);
  const matchingAttendances = await Attendance.find({
    student: studentObjId,
    event: { $in: recentEventIds }
  }).lean();

  const attendanceMap = new Map();
  matchingAttendances.forEach((att) => {
    attendanceMap.set(String(att.event), att.status);
  });

  const recentParticipation = recentRegs
    .filter((r) => Boolean(r.event))
    .map((r) => ({
      registrationId: r._id,
      ticketCode: r.ticketCode,
      event: {
        _id: r.event._id,
        title: r.event.title,
        category: r.event.category,
        date: r.event.date,
        startTime: r.event.startTime,
        endTime: r.event.endTime,
        venue: r.event.venue,
        bannerImage: r.event.bannerImage
      },
      registeredAt: r.createdAt || r.registrationDate,
      attendanceStatus: attendanceMap.get(String(r.event._id)) || 'unmarked'
    }));

  return {
    summary: {
      activeRegistrations: confirmedRegistrationsCount,
      cancelledRegistrations: cancelledRegistrationsCount,
      eventsAttended,
      eventsAbsent,
      attendanceRate,
      certificatesEarned: certificatesCount,
      reviewsSubmitted,
      averageRatingGiven
    },
    categoryDistribution,
    monthlyActivity,
    recentParticipation
  };
};

/**
 * Fetch Faculty & Organizer Performance Analytics
 * @param {string|mongoose.Types.ObjectId} organizerId
 */
export const getOrganizerAnalytics = async (organizerId) => {
  const organizerObjId = new mongoose.Types.ObjectId(organizerId);

  // 1. Fetch All Events Managed by this Organizer
  const organizerEvents = await Event.find({ organizer: organizerObjId }).lean();
  const totalEvents = organizerEvents.length;

  let approvedEventsCount = 0;
  let pendingEventsCount = 0;
  let rejectedEventsCount = 0;
  let draftEventsCount = 0;
  let cancelledEventsCount = 0;

  const approvedEventIds = [];
  let totalApprovedCapacity = 0;
  let totalApprovedRegistrations = 0;

  organizerEvents.forEach((ev) => {
    if (ev.isCancelled) {
      cancelledEventsCount++;
    }
    if (ev.status === 'approved') {
      approvedEventsCount++;
      approvedEventIds.push(ev._id);
      totalApprovedCapacity += ev.capacity || 0;
      totalApprovedRegistrations += ev.registeredCount || 0;
    } else if (ev.status === 'pending') {
      pendingEventsCount++;
    } else if (ev.status === 'rejected') {
      rejectedEventsCount++;
    } else if (ev.status === 'draft') {
      draftEventsCount++;
    }
  });

  const capacityUtilizationRate = totalApprovedCapacity > 0
    ? Math.round((totalApprovedRegistrations / totalApprovedCapacity) * 100)
    : 0;

  // 2. Attendance & Turnout across Organizer's Events
  const attendanceAgg = await Attendance.aggregate([
    { $match: { event: { $in: approvedEventIds } } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  let totalPresent = 0;
  let totalAbsent = 0;
  attendanceAgg.forEach((item) => {
    if (item._id === 'present') totalPresent = item.count;
    if (item._id === 'absent') totalAbsent = item.count;
  });

  const totalMarked = totalPresent + totalAbsent;
  const turnoutRate = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;

  // 3. Feedback Rating & Reviews across Organizer's Events
  const feedbackAgg = await Feedback.aggregate([
    { $match: { event: { $in: approvedEventIds } } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  const averageRating = feedbackAgg.length > 0 && feedbackAgg[0].avgRating
    ? Math.round(feedbackAgg[0].avgRating * 10) / 10
    : 0;
  const totalReviews = feedbackAgg.length > 0 ? feedbackAgg[0].totalReviews : 0;

  // 4. Category Distribution of Organizer's Events
  const categoryMap = new Map();
  organizerEvents.forEach((ev) => {
    const cat = ev.category || 'Other';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
  });

  const categoryDistribution = Array.from(categoryMap.entries()).map(([name, count]) => ({
    name,
    count,
    percentage: totalEvents > 0 ? Math.round((count / totalEvents) * 100) : 0
  })).sort((a, b) => b.count - a.count);

  // 5. Event-by-Event Performance Comparison (Up to 8 recent events)
  const sortedRecentEvents = [...organizerEvents]
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
    .slice(0, 8);

  const recentEventIds = sortedRecentEvents.map((e) => e._id);
  const eventAttendanceMap = new Map();

  if (recentEventIds.length > 0) {
    const recentAtts = await Attendance.aggregate([
      { $match: { event: { $in: recentEventIds }, status: 'present' } },
      { $group: { _id: '$event', presentCount: { $sum: 1 } } }
    ]);
    recentAtts.forEach((item) => {
      eventAttendanceMap.set(String(item._id), item.presentCount);
    });
  }

  const eventPerformance = sortedRecentEvents.map((ev) => ({
    _id: ev._id,
    title: ev.title,
    category: ev.category,
    date: ev.date,
    capacity: ev.capacity || 0,
    registeredCount: ev.registeredCount || 0,
    presentCount: eventAttendanceMap.get(String(ev._id)) || 0,
    status: ev.status,
    isCancelled: Boolean(ev.isCancelled)
  }));

  // 6. Monthly Registration Velocity across Organizer's Events
  const monthIntervals = getLast6Months();
  const sixMonthsAgo = monthIntervals[0].startDate;

  const monthlyRegs = await Registration.find({
    event: { $in: approvedEventIds },
    status: 'confirmed',
    createdAt: { $gte: sixMonthsAgo }
  }).select('createdAt registrationDate').lean();

  const monthlyTrend = monthIntervals.map((interval) => {
    const count = monthlyRegs.filter((r) => {
      const regDate = new Date(r.registrationDate || r.createdAt);
      return regDate >= interval.startDate && regDate <= interval.endDate;
    }).length;

    return {
      month: interval.label,
      key: interval.key,
      registrations: count
    };
  });

  return {
    summary: {
      totalEvents,
      approvedEvents: approvedEventsCount,
      pendingEvents: pendingEventsCount,
      rejectedEvents: rejectedEventsCount,
      draftEvents: draftEventsCount,
      cancelledEvents: cancelledEventsCount,
      totalRegistrations: totalApprovedRegistrations,
      totalCapacity: totalApprovedCapacity,
      capacityUtilizationRate,
      turnoutRate,
      totalPresentAttendees: totalPresent,
      totalReviews,
      averageRating
    },
    categoryDistribution,
    eventPerformance,
    monthlyTrend
  };
};

/**
 * Fetch Campus-Wide Institutional Analytics (Admin Command Center)
 */
export const getAdminAnalytics = async () => {
  // 1. Campus User Demographics
  const userRoleAgg = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  let totalStudents = 0;
  let totalOrganizers = 0;
  let totalAdmins = 0;

  userRoleAgg.forEach((item) => {
    if (item._id === 'student') totalStudents = item.count;
    if (item._id === 'organizer') totalOrganizers = item.count;
    if (item._id === 'admin') totalAdmins = item.count;
  });

  const totalUsers = totalStudents + totalOrganizers + totalAdmins;
  const activeUsersCount = await User.countDocuments({ isActive: true });

  // 2. Campus Event Throughput & Status Breakdown
  const eventStatusAgg = await Event.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalCapacity: { $sum: '$capacity' },
        totalRegistrations: { $sum: '$registeredCount' }
      }
    }
  ]);

  let totalEvents = 0;
  let approvedEvents = 0;
  let pendingEvents = 0;
  let rejectedEvents = 0;
  let draftEvents = 0;
  let approvedCapacity = 0;
  let approvedRegistrations = 0;

  eventStatusAgg.forEach((item) => {
    totalEvents += item.count;
    if (item._id === 'approved') {
      approvedEvents = item.count;
      approvedCapacity = item.totalCapacity || 0;
      approvedRegistrations = item.totalRegistrations || 0;
    } else if (item._id === 'pending') {
      pendingEvents = item.count;
    } else if (item._id === 'rejected') {
      rejectedEvents = item.count;
    } else if (item._id === 'draft') {
      draftEvents = item.count;
    }
  });

  const cancelledEvents = await Event.countDocuments({ isCancelled: true });

  // 3. Campus-Wide Attendance Rate
  const attendanceAgg = await Attendance.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  let totalPresent = 0;
  let totalAbsent = 0;
  attendanceAgg.forEach((item) => {
    if (item._id === 'present') totalPresent = item.count;
    if (item._id === 'absent') totalAbsent = item.count;
  });

  const totalMarked = totalPresent + totalAbsent;
  const campusAttendanceRate = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;

  // 4. Certificates and Feedback
  const [totalCertificatesIssued, feedbackAgg] = await Promise.all([
    Certificate.countDocuments({ status: 'valid' }),
    Feedback.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ])
  ]);

  const campusAverageRating = feedbackAgg.length > 0 && feedbackAgg[0].avgRating
    ? Math.round(feedbackAgg[0].avgRating * 10) / 10
    : 0;
  const totalReviews = feedbackAgg.length > 0 ? feedbackAgg[0].totalReviews : 0;

  // 5. Department Breakdown (Students and Participation)
  const studentDeptAgg = await User.aggregate([
    { $match: { role: 'student' } },
    {
      $group: {
        _id: '$department',
        studentCount: { $sum: 1 }
      }
    },
    { $sort: { studentCount: -1 } }
  ]);

  const regDeptAgg = await Registration.aggregate([
    { $match: { status: 'confirmed' } },
    {
      $lookup: {
        from: 'users',
        localField: 'student',
        foreignField: '_id',
        as: 'studentData'
      }
    },
    { $unwind: '$studentData' },
    {
      $group: {
        _id: '$studentData.department',
        registrationCount: { $sum: 1 }
      }
    }
  ]);

  const regDeptMap = new Map();
  regDeptAgg.forEach((item) => {
    regDeptMap.set(item._id || 'Unknown', item.registrationCount);
  });

  const departmentDistribution = studentDeptAgg.map((item) => ({
    department: item._id || 'General',
    studentCount: item.count || item.studentCount || 0,
    registrationCount: regDeptMap.get(item._id) || 0
  }));

  // 6. Category Distribution of Campus Events
  const categoryAgg = await Event.aggregate([
    { $match: { status: 'approved' } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const categoryDistribution = categoryAgg.map((item) => ({
    name: item._id || 'Other',
    count: item.count,
    percentage: approvedEvents > 0 ? Math.round((item.count / approvedEvents) * 100) : 0
  }));

  // 7. Monthly Campus Velocity (Events and Registrations)
  const monthIntervals = getLast6Months();
  const sixMonthsAgo = monthIntervals[0].startDate;

  const [monthlyEvents, monthlyRegs] = await Promise.all([
    Event.find({
      status: 'approved',
      date: { $gte: sixMonthsAgo }
    }).select('date').lean(),
    Registration.find({
      status: 'confirmed',
      createdAt: { $gte: sixMonthsAgo }
    }).select('createdAt registrationDate').lean()
  ]);

  const monthlyVelocity = monthIntervals.map((interval) => {
    const evCount = monthlyEvents.filter((ev) => {
      const d = new Date(ev.date);
      return d >= interval.startDate && d <= interval.endDate;
    }).length;

    const regCount = monthlyRegs.filter((r) => {
      const d = new Date(r.registrationDate || r.createdAt);
      return d >= interval.startDate && d <= interval.endDate;
    }).length;

    return {
      month: interval.label,
      key: interval.key,
      events: evCount,
      registrations: regCount
    };
  });

  // 8. Top Venues by Approved Event Bookings
  const venueAgg = await Event.aggregate([
    { $match: { status: 'approved' } },
    {
      $group: {
        _id: '$venue',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 6 }
  ]);

  const venueUtilization = venueAgg.map((item) => ({
    venue: item._id || 'TBD Venue',
    eventCount: item.count
  }));

  return {
    summary: {
      totalUsers,
      totalStudents,
      totalOrganizers,
      totalAdmins,
      activeUsers: activeUsersCount,
      totalEvents,
      approvedEvents,
      pendingEvents,
      rejectedEvents,
      draftEvents,
      cancelledEvents,
      totalApprovedCapacity: approvedCapacity,
      totalRegistrations: approvedRegistrations,
      campusAttendanceRate,
      totalPresent,
      totalCertificatesIssued,
      campusAverageRating,
      totalReviews
    },
    departmentDistribution,
    categoryDistribution,
    monthlyVelocity,
    venueUtilization
  };
};
