import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  Trash2,
  Send,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Clock4,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatCard from '../components/common/StatCard';
import SkeletonLoader from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EventFormModal from '../components/events/EventFormModal';
import { useToast } from '../context/ToastContext';
import apiClient from '../services/apiClient';

export const OrganizerEventsPage = () => {
  const toast = useToast();
  const addToast = (msg, type = 'info') => {
    if (typeof toast?.addToast === 'function') toast.addToast(msg, type);
    else if (typeof toast?.[type] === 'function') toast[type](msg);
    else if (typeof toast?.showToast === 'function') toast.showToast({ type, message: msg });
  };

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Delete Dialog State
  const [deleteEventTarget, setDeleteEventTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Submit Dialog State
  const [submitEventTarget, setSubmitEventTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMyEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/events/organizer/my-events');
      setEvents(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch organizer events:', err);
      addToast('Could not load your events. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchMyEvents();
  }, [fetchMyEvents]);

  // Handle Delete Event
  const handleDeleteConfirm = async () => {
    if (!deleteEventTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/events/${deleteEventTarget._id}`);
      addToast('Event deleted successfully.', 'success');
      setDeleteEventTarget(null);
      fetchMyEvents();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete event.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Submit for Review
  const handleSubmitConfirm = async () => {
    if (!submitEventTarget) return;
    setIsSubmitting(true);
    try {
      await apiClient.patch(`/events/${submitEventTarget._id}/submit`);
      addToast('Event submitted for administrative review!', 'success');
      setSubmitEventTarget(null);
      fetchMyEvents();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit event.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Events by Active Tab
  const filteredEvents = events.filter((ev) => {
    if (activeTab === 'all') return true;
    return ev.status === activeTab;
  });

  // Calculate Metrics
  const totalCount = events.length;
  const draftCount = events.filter((e) => e.status === 'draft').length;
  const pendingCount = events.filter((e) => e.status === 'pending').length;
  const approvedCount = events.filter((e) => e.status === 'approved').length;
  const rejectedCount = events.filter((e) => e.status === 'rejected').length;
  const totalRegistrations = events.reduce((sum, e) => sum + (e.registeredCount || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Header with Title and Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Event Management Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create, configure, schedule, and track all your department events and student workshops.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setEditingEvent(null);
            setIsFormOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create New Event
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Events"
          value={totalCount}
          icon={<FileText className="w-5 h-5 text-indigo-400" />}
          description="All created sessions"
        />
        <StatCard
          title="Approved & Live"
          value={approvedCount}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          description="Active campus events"
        />
        <StatCard
          title="Under Review"
          value={pendingCount}
          icon={<Clock4 className="w-5 h-5 text-amber-400" />}
          description="Awaiting approval"
        />
        <StatCard
          title="Total Registered"
          value={totalRegistrations}
          icon={<Users className="w-5 h-5 text-purple-400" />}
          description="Confirmed students"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 overflow-x-auto gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-slate-900 border-t border-x border-slate-800 text-indigo-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Events ({totalCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('draft')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'draft'
              ? 'bg-slate-900 border-t border-x border-slate-800 text-indigo-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Drafts ({draftCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'pending'
              ? 'bg-slate-900 border-t border-x border-slate-800 text-indigo-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Pending Review ({pendingCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'approved'
              ? 'bg-slate-900 border-t border-x border-slate-800 text-indigo-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Approved ({approvedCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rejected')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'rejected'
              ? 'bg-slate-900 border-t border-x border-slate-800 text-indigo-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Needs Revision ({rejectedCount})
        </button>
      </div>

      {/* Events List / Cards */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
              <SkeletonLoader height="28px" width="40%" />
              <SkeletonLoader height="16px" count={2} />
              <SkeletonLoader height="36px" width="20%" />
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          title={`No ${activeTab !== 'all' ? activeTab : ''} events found`}
          description={
            activeTab === 'draft'
              ? 'You have no saved drafts.'
              : activeTab === 'pending'
              ? 'No events currently under admin review.'
              : 'Create a new campus event or switch tabs.'
          }
          actionLabel="Create Event Now"
          onAction={() => {
            setEditingEvent(null);
            setIsFormOpen(true);
          }}
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
                className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group"
              >
                {/* Event Summary Details */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="purple" size="sm">
                      {event.category}
                    </Badge>

                    {event.status === 'approved' && (
                      <Badge variant="success" size="sm" hasDot>
                        Approved & Live
                      </Badge>
                    )}
                    {event.status === 'pending' && (
                      <Badge variant="warning" size="sm" hasDot>
                        Pending Admin Approval
                      </Badge>
                    )}
                    {event.status === 'draft' && (
                      <Badge variant="neutral" size="sm">
                        Draft (Private)
                      </Badge>
                    )}
                    {event.status === 'rejected' && (
                      <Badge variant="danger" size="sm" hasDot>
                        Revision Requested
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {event.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 max-w-3xl">
                    {event.description}
                  </p>

                  {/* Rejection reason banner */}
                  {event.status === 'rejected' && event.rejectionReason && (
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-semibold">Admin Feedback:</strong>
                        <span>{event.rejectionReason}</span>
                      </div>
                    </div>
                  )}

                  {/* Metadata Chips */}
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
                      {event.registeredCount || 0} / {event.capacity} seats
                    </span>
                  </div>
                </div>

                {/* Action Buttons Column */}
                <div className="flex flex-wrap sm:flex-nowrap md:flex-col items-stretch md:items-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                  {event.status === 'draft' && (
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<Send className="w-3.5 h-3.5" />}
                      onClick={() => setSubmitEventTarget(event)}
                    >
                      Submit for Review
                    </Button>
                  )}

                  {event.status === 'approved' && (
                    <Link to={`/organizer/attendance?eventId=${event._id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10"
                        leftIcon={<Users className="w-3.5 h-3.5" />}
                      >
                        Attendance ({event.registeredCount || 0})
                      </Button>
                    </Link>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Edit className="w-3.5 h-3.5" />}
                      onClick={() => {
                        setEditingEvent(event);
                        setIsFormOpen(true);
                      }}
                    >
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={() => setDeleteEventTarget(event)}
                    >
                      Delete
                    </Button>

                    <Link to={`/events/${event._id}`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        title="View Public Details"
                        className="px-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <EventFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEvent(null);
        }}
        event={editingEvent}
        onSuccess={() => fetchMyEvents()}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteEventTarget}
        onClose={() => setDeleteEventTarget(null)}
        onConfirm={handleDeleteConfirm}
        isConfirming={isDeleting}
        title="Delete Campus Event?"
        message={`Are you sure you want to permanently delete "${deleteEventTarget?.title}"? All scheduled timings and information will be removed.`}
        confirmText="Delete Event"
        confirmVariant="danger"
      />

      {/* Confirm Submit Dialog */}
      <ConfirmDialog
        isOpen={!!submitEventTarget}
        onClose={() => setSubmitEventTarget(null)}
        onConfirm={handleSubmitConfirm}
        isConfirming={isSubmitting}
        title="Submit Event for Administrative Review?"
        message={`Submitting "${submitEventTarget?.title}" will send it to campus administration for approval. It will undergo venue conflict verification.`}
        confirmText="Submit for Review"
        confirmVariant="primary"
      />
    </div>
  );
};

export default OrganizerEventsPage;
