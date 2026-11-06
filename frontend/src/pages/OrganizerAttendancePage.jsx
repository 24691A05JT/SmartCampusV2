import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Download,
  Calendar,
  MapPin,
  Building,
  Save,
  CheckCheck,
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  RefreshCw,
  Award
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatCard from '../components/common/StatCard';
import SkeletonLoader from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';
import AttendanceStatusBadge from '../components/registrations/AttendanceStatusBadge';
import { useToast } from '../context/ToastContext';
import apiClient from '../services/apiClient';

export const OrganizerAttendancePage = () => {
  const toast = useToast();
  const addToast = (msg, type = 'info') => {
    if (typeof toast?.addToast === 'function') toast.addToast(msg, type);
    else if (typeof toast?.[type] === 'function') toast[type](msg);
    else if (typeof toast?.showToast === 'function') toast.showToast({ type, message: msg });
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const initialEventId = searchParams.get('eventId') || '';

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Roster state
  const [rosterData, setRosterData] = useState(null);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [rosterError, setRosterError] = useState(null);

  // Local modified attendance map for editing: studentId -> { status, remarks, dirty }
  const [modifiedAttendance, setModifiedAttendance] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isIssuingCertificates, setIsIssuingCertificates] = useState(false);
  const [issuingStudentId, setIssuingStudentId] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // 1. Fetch Organizer Events for the dropdown
  useEffect(() => {
    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        const res = await apiClient.get('/events/organizer/my-events');
        const list = res.data || [];
        setEvents(list);

        // If no selected event, select first approved event if present
        if (!selectedEventId && list.length > 0) {
          const firstApproved = list.find((e) => e.status === 'approved') || list[0];
          setSelectedEventId(firstApproved._id);
        }
      } catch (err) {
        console.error('Failed to load organizer events:', err);
        addToast('Unable to load your events list.', 'error');
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  // 2. Fetch Participant Roster for Selected Event
  const fetchRoster = useCallback(async (eventId) => {
    if (!eventId) return;
    setLoadingRoster(true);
    setRosterError(null);
    try {
      const res = await apiClient.get(`/attendance/event/${eventId}`);
      setRosterData(res.data);

      // Hydrate local editable state
      const initialMap = {};
      (res.data.participants || []).forEach((p) => {
        if (p.student?._id) {
          initialMap[p.student._id] = {
            status: p.attendance?.status || 'unmarked',
            remarks: p.attendance?.remarks || '',
            dirty: false
          };
        }
      });
      setModifiedAttendance(initialMap);
    } catch (err) {
      console.error('Failed to fetch participant roster:', err);
      setRosterError(err.message || 'Unable to load participant roster.');
    } finally {
      setLoadingRoster(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchRoster(selectedEventId);
      setSearchParams({ eventId: selectedEventId });
    }
  }, [selectedEventId, fetchRoster, setSearchParams]);

  const handleEventChange = (e) => {
    setSelectedEventId(e.target.value);
  };

  const handleStatusChange = (studentId, status) => {
    setModifiedAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        dirty: true
      }
    }));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setModifiedAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
        dirty: true
      }
    }));
  };

  // Mark all unmarked students as present locally
  const handleMarkAllUnmarkedPresent = () => {
    setModifiedAttendance((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((sId) => {
        if (next[sId].status === 'unmarked') {
          next[sId] = {
            ...next[sId],
            status: 'present',
            dirty: true
          };
        }
      });
      return next;
    });
    addToast('Marked all unmarked participants as Present. Click Save Changes to commit.', 'info');
  };

  // Save changes via Bulk Mark API
  const handleSaveChanges = async () => {
    if (!selectedEventId) return;

    // Filter only modified records or all records
    const dirtyStudentIds = Object.keys(modifiedAttendance).filter(
      (sId) => modifiedAttendance[sId].dirty && ['present', 'absent'].includes(modifiedAttendance[sId].status)
    );

    if (dirtyStudentIds.length === 0) {
      addToast('No changes to save.', 'info');
      return;
    }

    setIsSaving(true);
    try {
      const records = dirtyStudentIds.map((sId) => ({
        studentId: sId,
        status: modifiedAttendance[sId].status,
        remarks: modifiedAttendance[sId].remarks
      }));

      await apiClient.post('/attendance/bulk-mark', {
        eventId: selectedEventId,
        records
      });

      addToast(`Successfully saved attendance for ${records.length} participants!`, 'success');
      await fetchRoster(selectedEventId);
    } catch (err) {
      console.error('Failed to save attendance:', err);
      addToast(err.message || 'Error saving attendance.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Export Roster as CSV
  const handleExportCSV = () => {
    if (!rosterData || !rosterData.participants || rosterData.participants.length === 0) {
      addToast('No participant data to export.', 'warning');
      return;
    }

    const headers = [
      'Ticket Code',
      'Student Name',
      'Email',
      'Department',
      'Year',
      'Registration Date',
      'Attendance Status',
      'Remarks'
    ];

    const rows = rosterData.participants.map((p) => {
      const current = modifiedAttendance[p.student?._id] || p.attendance || {};
      return [
        `"${p.ticketCode || ''}"`,
        `"${p.student?.name || ''}"`,
        `"${p.student?.email || ''}"`,
        `"${p.student?.department || ''}"`,
        `"${p.student?.year || ''}"`,
        `"${p.registrationDate ? new Date(p.registrationDate).toLocaleDateString() : ''}"`,
        `"${current.status || 'unmarked'}"`,
        `"${(current.remarks || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Attendance_${rosterData.event?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'Event'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Attendance roster exported successfully.', 'success');
  };

  // Issue Single Certificate for Attendee
  const handleSingleIssueCertificate = async (studentId) => {
    if (!selectedEventId || !studentId) return;
    setIssuingStudentId(studentId);
    try {
      const res = await apiClient.post('/certificates/generate/single', {
        eventId: selectedEventId,
        studentId
      });
      addToast(`Certificate ${res.data.certificateId} issued successfully!`, 'success');
    } catch (err) {
      console.error('Single cert issue error:', err);
      addToast(err.response?.data?.message || 'Failed to issue certificate.', 'error');
    } finally {
      setIssuingStudentId(null);
    }
  };

  // Batch Issue Certificates for all Present Attendees
  const handleBatchIssueCertificates = async () => {
    if (!selectedEventId) return;
    setIsIssuingCertificates(true);
    try {
      const res = await apiClient.post(`/certificates/generate/batch/${selectedEventId}`);
      const data = res.data;
      addToast(
        `Batch generation completed: ${data.generatedCount} issued, ${data.alreadyIssuedCount} already had certificates.`,
        'success'
      );
    } catch (err) {
      console.error('Batch cert issue error:', err);
      addToast(err.response?.data?.message || 'Failed to generate batch certificates.', 'error');
    } finally {
      setIsIssuingCertificates(false);
    }
  };

  // Filtered Participants List
  const filteredParticipants = useMemo(() => {
    if (!rosterData?.participants) return [];

    return rosterData.participants.filter((p) => {
      const currentStatus = modifiedAttendance[p.student?._id]?.status || p.attendance?.status || 'unmarked';

      if (statusFilter !== 'all' && currentStatus !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = p.student?.name?.toLowerCase().includes(q);
        const emailMatch = p.student?.email?.toLowerCase().includes(q);
        const ticketMatch = p.ticketCode?.toLowerCase().includes(q);
        const deptMatch = p.student?.department?.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !ticketMatch && !deptMatch) return false;
      }

      return true;
    });
  }, [rosterData, modifiedAttendance, statusFilter, searchQuery]);

  const hasUnsavedChanges = useMemo(() => {
    return Object.values(modifiedAttendance).some((m) => m.dirty);
  }, [modifiedAttendance]);

  const event = rosterData?.event;
  const stats = rosterData?.stats;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/organizer/events"
              className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Events</span>
            </Link>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Attendance & Participant Management
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Audit confirmed event registrations, mark live attendance, and maintain verified participation records.
          </p>
        </div>

        {/* Event Selector Dropdown */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[280px]">
            <select
              value={selectedEventId}
              onChange={handleEventChange}
              disabled={loadingEvents || events.length === 0}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer pr-10"
            >
              {events.length === 0 ? (
                <option value="">No events found</option>
              ) : (
                events.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.title} ({e.status.toUpperCase()})
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRoster(selectedEventId)}
            disabled={!selectedEventId || loadingRoster}
            className="p-2.5"
            title="Refresh Roster"
          >
            <RefreshCw className={`w-4 h-4 ${loadingRoster ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Selected Event Details Card */}
      {event && (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                Active Session
              </span>
              <h2 className="text-lg font-bold text-white">{event.title}</h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  {event.date ? new Date(event.date).toLocaleDateString() : 'TBA'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  {event.startTime} - {event.endTime}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  {event.venue}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={!rosterData?.participants?.length}
                className="gap-2 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleBatchIssueCertificates}
                disabled={isIssuingCertificates || stats?.presentCount === 0}
                className="gap-2 text-xs bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white border-0 shadow-md shadow-indigo-600/20"
                title="Issue certificates to all verified present attendees"
              >
                <Award className="w-3.5 h-3.5" />
                <span>{isIssuingCertificates ? 'Generating...' : 'Issue Batch Certificates'}</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveChanges}
                disabled={!hasUnsavedChanges || isSaving}
                className="gap-2 text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            title="Confirmed Registrations"
            value={stats.totalConfirmed}
            subtitle="Reserved seats"
            accent="indigo"
            icon={Users}
          />
          <StatCard
            title="Marked Present"
            value={stats.presentCount}
            subtitle="Verified attendance"
            accent="emerald"
            icon={CheckCircle2}
          />
          <StatCard
            title="Marked Absent"
            value={stats.absentCount}
            subtitle="Absent students"
            accent="rose"
            icon={XCircle}
          />
          <StatCard
            title="Pending Review"
            value={stats.unmarkedCount}
            subtitle="Unmarked status"
            accent="amber"
            icon={Clock}
          />
          <StatCard
            title="Turnout Rate"
            value={`${stats.attendanceRate}%`}
            subtitle="Present / Confirmed"
            accent="purple"
            icon={CheckCheck}
          />
        </div>
      )}

      {/* Roster Controls: Search & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div
          role="group"
          aria-label="Filter participants by attendance status"
          className="flex items-center gap-1.5 overflow-x-auto"
        >
          {[
            { id: 'all', label: 'All Participants' },
            { id: 'unmarked', label: 'Unmarked' },
            { id: 'present', label: 'Present' },
            { id: 'absent', label: 'Absent' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {stats?.unmarkedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllUnmarkedPresent}
              className="text-xs gap-1.5 whitespace-nowrap"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mark All Unmarked Present</span>
            </Button>
          )}

          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="search-attendance-input"
              aria-label="Search participant by name or ticket code"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student or ticket..."
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-indigo-300">
            <AlertTriangle className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>You have unsaved attendance modifications. Remember to save changes before leaving.</span>
          </div>
          <Button variant="primary" size="sm" onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}

      {/* Participant Roster Table */}
      {loadingRoster ? (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <SkeletonLoader height="30px" width="100%" />
          <SkeletonLoader height="60px" width="100%" />
          <SkeletonLoader height="60px" width="100%" />
          <SkeletonLoader height="60px" width="100%" />
        </div>
      ) : rosterError ? (
        <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">Error Loading Roster</h3>
          <p className="text-xs text-rose-300 max-w-md mx-auto">{rosterError}</p>
          <Button variant="outline" size="sm" onClick={() => fetchRoster(selectedEventId)}>
            Try Again
          </Button>
        </div>
      ) : filteredParticipants.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searchQuery ? 'No Participants Found' : 'No Students Registered Yet'}
          description={
            searchQuery
              ? `No student matches "${searchQuery}". Try a different name or clear the search.`
              : 'As students register for this event, their names and ticket codes will appear in this roster.'
          }
        />
      ) : (
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" aria-label="Event participant attendance roster">
              <caption className="sr-only">Roster of registered participants and attendance tracking</caption>
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th scope="col" className="py-3.5 px-4">Student</th>
                  <th scope="col" className="py-3.5 px-4">Department & Year</th>
                  <th scope="col" className="py-3.5 px-4">Ticket Code</th>
                  <th scope="col" className="py-3.5 px-4">Attendance Status</th>
                  <th scope="col" className="py-3.5 px-4">Remarks</th>
                  <th scope="col" className="py-3.5 px-4 text-center">Certificate</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Audit Info</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredParticipants.map((p) => {
                  const student = p.student || {};
                  const studentId = student._id;
                  const current = modifiedAttendance[studentId] || {
                    status: p.attendance?.status || 'unmarked',
                    remarks: p.attendance?.remarks || ''
                  };

                  return (
                    <tr
                      key={p.registrationId}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Student info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center shrink-0">
                            {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs">{student.name || 'Student'}</p>
                            <p className="text-slate-400 text-[11px]">{student.email || ''}</p>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-300 font-medium">
                          {student.department || 'General'}
                        </span>
                        <span className="text-slate-500 text-[11px] block">
                          Year {student.year || 1}
                        </span>
                      </td>

                      {/* Ticket Code */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-indigo-400 font-semibold bg-slate-900 px-2 py-1 rounded border border-slate-800">
                          {p.ticketCode}
                        </span>
                      </td>

                      {/* Status Toggle Buttons */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(studentId, 'present')}
                            aria-pressed={current.status === 'present'}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                              current.status === 'present'
                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                : 'bg-slate-900 text-slate-400 hover:text-emerald-400 border border-slate-800'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Present</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(studentId, 'absent')}
                            aria-pressed={current.status === 'absent'}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                              current.status === 'absent'
                                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                                : 'bg-slate-900 text-slate-400 hover:text-rose-400 border border-slate-800'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Absent</span>
                          </button>

                          {current.status === 'unmarked' && (
                            <span className="text-[11px] text-slate-500 italic pl-1">
                              Unmarked
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Remarks Input */}
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          value={current.remarks || ''}
                          onChange={(e) => handleRemarksChange(studentId, e.target.value)}
                          placeholder="Optional remarks..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </td>

                      {/* Certificate Single Action */}
                      <td className="py-3.5 px-4 text-center">
                        {current.status === 'present' ? (
                          <button
                            type="button"
                            onClick={() => handleSingleIssueCertificate(studentId)}
                            disabled={issuingStudentId === studentId}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/30 flex items-center gap-1 mx-auto transition"
                            title="Issue certificate"
                          >
                            <Award className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{issuingStudentId === studentId ? 'Issuing...' : 'Issue Cert'}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Ineligible</span>
                        )}
                      </td>

                      {/* Audit Info */}
                      <td className="py-3.5 px-4 text-right text-[11px] text-slate-500">
                        {p.attendance?.markedAt ? (
                          <div>
                            <span className="block text-slate-400">
                              {new Date(p.attendance.markedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span>{p.attendance.markedBy?.name || 'Faculty'}</span>
                          </div>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerAttendancePage;
