import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Ban,
  ArrowRight
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatCard from '../components/common/StatCard';
import SkeletonLoader from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import TicketModal from '../components/registrations/TicketModal';
import AttendanceStatusBadge from '../components/registrations/AttendanceStatusBadge';
import { useToast } from '../context/ToastContext';
import apiClient from '../services/apiClient';

export const StudentRegistrationsPage = () => {
  const toast = useToast();
  const addToast = (msg, type = 'info') => {
    if (typeof toast?.addToast === 'function') toast.addToast(msg, type);
    else if (typeof toast?.[type] === 'function') toast[type](msg);
    else if (typeof toast?.showToast === 'function') toast.showToast({ type, message: msg });
  };

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Ticket Modal State
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);

  // Cancellation State
  const [cancelTarget, setCancelTarget] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/registrations/my-registrations');
      setRegistrations(res.data || []);
    } catch (err) {
      console.error('Failed to load registrations:', err);
      setError(err.message || 'Unable to load registrations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  // Derived Stats
  const stats = useMemo(() => {
    const total = registrations.length;
    const confirmed = registrations.filter((r) => r.status === 'confirmed').length;
    const attended = registrations.filter(
      (r) => r.status === 'confirmed' && r.attendance?.status === 'present'
    ).length;
    const cancelled = registrations.filter((r) => r.status === 'cancelled').length;
    const rate = confirmed > 0 ? Math.round((attended / confirmed) * 100) : 0;

    return { total, confirmed, attended, cancelled, rate };
  }, [registrations]);

  // Tab Filtering & Search
  const filteredRegistrations = useMemo(() => {
    const now = new Date();

    return registrations.filter((reg) => {
      const event = reg.event || {};
      const eventDate = event.date ? new Date(event.date) : null;
      const isPast = eventDate ? eventDate < now : false;

      // Tab Filter
      if (activeTab === 'upcoming' && (reg.status !== 'confirmed' || isPast)) return false;
      if (activeTab === 'attended' && reg.attendance?.status !== 'present') return false;
      if (activeTab === 'cancelled' && reg.status !== 'cancelled') return false;

      // Keyword Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = event.title?.toLowerCase().includes(query);
        const venueMatch = event.venue?.toLowerCase().includes(query);
        const codeMatch = reg.ticketCode?.toLowerCase().includes(query);
        if (!titleMatch && !venueMatch && !codeMatch) return false;
      }

      return true;
    });
  }, [registrations, activeTab, searchQuery]);

  const handleOpenTicket = (registration) => {
    setSelectedRegistration(registration);
    setIsTicketOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setIsCancelling(true);
    try {
      await apiClient.patch(`/registrations/${cancelTarget._id}/cancel`);
      addToast('Registration cancelled successfully.', 'success');
      setCancelTarget(null);
      await fetchRegistrations();
    } catch (err) {
      console.error('Cancellation failed:', err);
      addToast(err.message || 'Unable to cancel registration.', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">My Event Registrations</h1>
          <p className="text-sm text-slate-400 mt-1">
            View your event passes, check attendance, and manage campus activity bookings.
          </p>
        </div>

        <Link to="/events">
          <Button variant="primary" className="gap-2">
            <span>Explore Campus Events</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Passes"
          value={stats.confirmed}
          subtitle="Confirmed bookings"
          accent="indigo"
          icon={Ticket}
        />
        <StatCard
          title="Events Attended"
          value={stats.attended}
          subtitle="Verified present"
          accent="emerald"
          icon={CheckCircle2}
        />
        <StatCard
          title="Attendance Rate"
          value={`${stats.rate}%`}
          subtitle="Participation score"
          accent="purple"
          icon={Calendar}
        />
        <StatCard
          title="Cancelled"
          value={stats.cancelled}
          subtitle="Released seats"
          accent="rose"
          icon={Ban}
        />
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Registrations', count: registrations.length },
            { id: 'upcoming', label: 'Upcoming', count: stats.confirmed },
            { id: 'attended', label: 'Attended', count: stats.attended },
            { id: 'cancelled', label: 'Cancelled', count: stats.cancelled }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-indigo-700/80 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search event or ticket..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
              <SkeletonLoader height="140px" className="rounded-xl" />
              <SkeletonLoader height="20px" width="70%" />
              <SkeletonLoader height="14px" width="40%" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">Failed to Load Registrations</h3>
          <p className="text-xs text-rose-300 max-w-md mx-auto">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchRegistrations}>
            Try Again
          </Button>
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title={
            searchQuery
              ? 'No Matching Registrations Found'
              : activeTab === 'upcoming'
              ? 'No Upcoming Event Bookings'
              : activeTab === 'attended'
              ? 'No Attended Events Yet'
              : activeTab === 'cancelled'
              ? 'No Cancelled Registrations'
              : 'You Have Not Registered for Any Events Yet'
          }
          description={
            searchQuery
              ? `No registrations match "${searchQuery}". Clear your search query to see all.`
              : 'Browse active college events, reserve your seat, and receive an instant entrance boarding pass.'
          }
          actionLabel="Browse Events"
          onAction={() => window.location.assign('/events')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRegistrations.map((reg) => {
            const event = reg.event || {};
            const isConfirmed = reg.status === 'confirmed';
            const eventDate = event.date
              ? new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })
              : 'Date TBA';

            const now = new Date();
            const isPastEvent = event.date ? new Date(event.date) < now : false;

            return (
              <div
                key={reg._id}
                className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden flex flex-col hover:border-slate-700/80 transition-all duration-300 group shadow-lg"
              >
                {/* Event Image Banner */}
                <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                  {event.bannerImage ? (
                    <img
                      src={event.bannerImage}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-indigo-950 via-slate-900 to-purple-950 text-slate-500">
                      <Ticket className="w-12 h-12 opacity-30" />
                    </div>
                  )}

                  {/* Top Overlay Chips */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 text-white backdrop-blur border border-white/10">
                      {event.category || 'Event'}
                    </span>

                    {/* Status Badge */}
                    {isConfirmed ? (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur">
                        Confirmed
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 backdrop-blur">
                        Cancelled
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-indigo-400 font-bold tracking-wide">
                        {reg.ticketCode}
                      </span>
                      <AttendanceStatusBadge status={reg.attendance?.status || 'unmarked'} />
                    </div>

                    <Link to={`/events/${event._id}`}>
                      <h3 className="text-base font-bold text-white hover:text-indigo-400 transition line-clamp-1">
                        {event.title || 'Untitled Event'}
                      </h3>
                    </Link>

                    <div className="space-y-1.5 text-xs text-slate-400 pt-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{eventDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>
                          {event.startTime || '10:00'} - {event.endTime || '12:00'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{event.venue || 'Campus Facility'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      onClick={() => handleOpenTicket(reg)}
                      className="gap-1.5 text-xs"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>View Pass</span>
                    </Button>

                    {isConfirmed && !isPastEvent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCancelTarget(reg)}
                        className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        title="Cancel Registration"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Pass Modal */}
      <TicketModal
        isOpen={isTicketOpen}
        onClose={() => {
          setIsTicketOpen(false);
          setSelectedRegistration(null);
        }}
        registration={selectedRegistration}
      />

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Event Registration?"
        message={`Are you sure you want to cancel your seat for "${
          cancelTarget?.event?.title || 'this event'
        }"? Your ticket ${cancelTarget?.ticketCode} will be invalidated and your seat made available to other students.`}
        confirmText="Confirm Cancellation"
        variant="danger"
        isLoading={isCancelling}
      />
    </div>
  );
};

export default StudentRegistrationsPage;
