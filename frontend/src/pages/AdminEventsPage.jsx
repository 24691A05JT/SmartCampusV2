import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  MapPin,
  Users,
  Building,
  AlertCircle,
  Eye,
  FileCheck2,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatCard from '../components/common/StatCard';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import SkeletonLoader from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';
import apiClient from '../services/apiClient';

export const AdminEventsPage = () => {
  const toast = useToast();
  const addToast = (msg, type = 'info') => {
    if (typeof toast?.addToast === 'function') toast.addToast(msg, type);
    else if (typeof toast?.[type] === 'function') toast[type](msg);
    else if (typeof toast?.showToast === 'function') toast.showToast({ type, message: msg });
  };

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('pending');

  // Approve Dialog State
  const [approveTarget, setApproveTarget] = useState(null);
  const [isApproving, setIsApproving] = useState(false);

  // Reject Modal State
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const fetchAdminEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/events/admin/all');
      setEvents(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch admin events:', err);
      addToast('Could not load administrative events queue.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchAdminEvents();
  }, [fetchAdminEvents]);

  // Handle Approve Event
  const handleApproveConfirm = async () => {
    if (!approveTarget) return;
    setIsApproving(true);
    try {
      await apiClient.patch(`/events/${approveTarget._id}/approve`);
      addToast(`Event "${approveTarget.title}" approved and published!`, 'success');
      setApproveTarget(null);
      fetchAdminEvents();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to approve event.', 'error');
    } finally {
      setIsApproving(false);
    }
  };

  // Handle Reject Event
  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      setRejectError('A clear rejection reason or revision instruction is mandatory.');
      return;
    }

    setIsRejecting(true);
    try {
      await apiClient.patch(`/events/${rejectTarget._id}/reject`, {
        rejectionReason: rejectionReason.trim()
      });
      addToast(`Event rejected. Organizer notified with revision details.`, 'info');
      setRejectTarget(null);
      setRejectionReason('');
      setRejectError('');
      fetchAdminEvents();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to reject event.', 'error');
    } finally {
      setIsRejecting(false);
    }
  };

  // Metrics
  const totalCount = events.length;
  const pendingCount = events.filter((e) => e.status === 'pending').length;
  const approvedCount = events.filter((e) => e.status === 'approved').length;
  const rejectedCount = events.filter((e) => e.status === 'rejected').length;

  const filteredEvents = events.filter((e) => {
    if (activeFilter === 'all') return true;
    return e.status === activeFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
              Campus Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Event Approval & Governance Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review event proposals, audit venue scheduling allocations, and approve student-facing
            activities.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchAdminEvents}
          leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
        >
          Refresh Queue
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Pending Review"
          value={pendingCount}
          icon={<Clock className="w-5 h-5 text-amber-400" />}
          description="Awaiting admin action"
        />
        <StatCard
          title="Approved Events"
          value={approvedCount}
          icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
          description="Published to students"
        />
        <StatCard
          title="Revisions Needed"
          value={rejectedCount}
          icon={<XCircle className="w-5 h-5 text-rose-400" />}
          description="Returned with feedback"
        />
        <StatCard
          title="Total Governed"
          value={totalCount}
          icon={<FileCheck2 className="w-5 h-5 text-indigo-400" />}
          description="Institutional history"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto gap-2">
        <button
          type="button"
          onClick={() => setActiveFilter('pending')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeFilter === 'pending'
              ? 'bg-slate-900 border-t border-x border-slate-800 text-amber-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Pending Review</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('approved')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeFilter === 'approved'
              ? 'bg-slate-900 border-t border-x border-slate-800 text-indigo-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Approved ({approvedCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('rejected')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeFilter === 'rejected'
              ? 'bg-slate-900 border-t border-x border-slate-800 text-indigo-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Needs Revision ({rejectedCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeFilter === 'all'
              ? 'bg-slate-900 border-t border-x border-slate-800 text-indigo-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Events ({totalCount})
        </button>
      </div>

      {/* Events Queue */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
              <SkeletonLoader height="28px" width="50%" />
              <SkeletonLoader height="16px" count={2} />
              <SkeletonLoader height="36px" width="30%" />
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          title={`No ${activeFilter !== 'all' ? activeFilter : ''} events found`}
          description={
            activeFilter === 'pending'
              ? 'Great job! The event approval queue is completely clear.'
              : 'No campus events match this filter.'
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <div
                key={event._id}
                className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Event Summary */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="purple" size="sm">
                      {event.category}
                    </Badge>
                    <Badge variant="neutral" size="sm">
                      {event.targetDepartment || 'All Departments'}
                    </Badge>

                    {event.status === 'approved' && (
                      <Badge variant="success" size="sm" hasDot>
                        Approved & Live
                      </Badge>
                    )}
                    {event.status === 'pending' && (
                      <Badge variant="warning" size="sm" hasDot>
                        Pending Admin Review
                      </Badge>
                    )}
                    {event.status === 'draft' && (
                      <Badge variant="neutral" size="sm">
                        Draft
                      </Badge>
                    )}
                    {event.status === 'rejected' && (
                      <Badge variant="danger" size="sm" hasDot>
                        Needs Revision
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {event.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 max-w-3xl">
                    {event.description}
                  </p>

                  {/* Organizer Details */}
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      Submitted by:{' '}
                      <strong className="text-white">
                        {event.organizer?.name || 'Faculty Organizer'}
                      </strong>{' '}
                      ({event.organizer?.email || 'N/A'})
                    </span>
                  </div>

                  {/* Rejection reason banner */}
                  {event.status === 'rejected' && event.rejectionReason && (
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-semibold">Previous Rejection Reason:</strong>
                        <span>{event.rejectionReason}</span>
                      </div>
                    </div>
                  )}

                  {/* Timings & Venue Chips */}
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-300 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      {formattedDate}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      {event.startTime} – {event.endTime}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      {event.venue}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      {event.capacity} Max Attendees
                    </span>
                  </div>
                </div>

                {/* Administrative Controls */}
                <div className="flex flex-wrap lg:flex-col items-stretch lg:items-end gap-2.5 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
                  {event.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="success"
                        leftIcon={<CheckCircle className="w-4 h-4" />}
                        onClick={() => setApproveTarget(event)}
                      >
                        Approve Event
                      </Button>

                      <Button
                        size="sm"
                        variant="danger"
                        leftIcon={<XCircle className="w-4 h-4" />}
                        onClick={() => {
                          setRejectTarget(event);
                          setRejectionReason('');
                          setRejectError('');
                        }}
                      >
                        Reject with Reason
                      </Button>
                    </>
                  )}

                  <Link to={`/events/${event._id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Eye className="w-4 h-4" />}
                    >
                      View Full Details
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Approve Dialog */}
      <ConfirmDialog
        isOpen={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApproveConfirm}
        isConfirming={isApproving}
        title="Approve & Publish Campus Event?"
        message={`Approving "${approveTarget?.title}" will immediately make it visible to all students on the campus discovery portal, lock in the venue slot, and record an audit log entry.`}
        confirmText="Approve & Publish"
        confirmVariant="success"
      />

      {/* Reject Modal with Mandatory Rejection Reason */}
      <Modal
        isOpen={!!rejectTarget}
        onClose={() => {
          setRejectTarget(null);
          setRejectionReason('');
          setRejectError('');
        }}
        size="md"
        title="Reject Event Proposal"
        description="Provide a clear explanation for this rejection. The organizer will receive this feedback to make required revisions."
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
            <strong>Target Event:</strong> {rejectTarget?.title}
            <div className="text-slate-400 mt-0.5">
              Venue: {rejectTarget?.venue} | {rejectTarget?.startTime} - {rejectTarget?.endTime}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Mandatory Rejection Reason / Revision Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="e.g., The scheduled time overlaps with department midterms, or please adjust capacity to fit Room 204 safety limits..."
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                if (e.target.value.trim()) setRejectError('');
              }}
              className={`w-full px-4 py-3 bg-slate-900/90 text-slate-100 text-sm rounded-xl border appearance-none outline-none transition-all ${
                rejectError
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-800 hover:border-slate-700 focus:border-indigo-500'
              }`}
            />
            {rejectError && <p className="text-xs text-rose-400 font-medium">{rejectError}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setRejectionReason('');
                setRejectError('');
              }}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRejectSubmit}
              isLoading={isRejecting}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminEventsPage;
