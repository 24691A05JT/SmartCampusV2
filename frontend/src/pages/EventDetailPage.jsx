import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Building,
  GraduationCap,
  Tag,
  AlertCircle,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Hourglass,
  Ticket,
  ClipboardList
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import SkeletonLoader from '../components/common/SkeletonLoader';
import ConfirmDialog from '../components/common/ConfirmDialog';
import TicketModal from '../components/registrations/TicketModal';
import EventReviewsSection from '../components/feedback/EventReviewsSection';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import apiClient from '../services/apiClient';

export const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const addToast = (msg, type = 'info') => {
    if (typeof toast?.addToast === 'function') toast.addToast(msg, type);
    else if (typeof toast?.[type] === 'function') toast[type](msg);
    else if (typeof toast?.showToast === 'function') toast.showToast({ type, message: msg });
  };

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Student registration states
  const [isRegistered, setIsRegistered] = useState(false);
  const [myRegistration, setMyRegistration] = useState(null);
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isTicketOpen, setIsTicketOpen] = useState(false);

  // Cancellation state
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch Event Details
  const fetchEvent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/events/${id}`);
      setEvent(res.data);
    } catch (err) {
      console.error('Failed to load event details:', err);
      setError(err.message || 'Event not found or unavailable.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Check current student registration
  const checkRegistrationStatus = useCallback(async () => {
    if (!user || user.role !== 'student' || !id) return;
    setCheckingRegistration(true);
    try {
      const res = await apiClient.get(`/registrations/event/${id}/check`);
      if (res.data) {
        setIsRegistered(res.data.isRegistered);
        setMyRegistration(res.data.registration);
      }
    } catch (err) {
      console.warn('Failed to check registration status:', err);
    } finally {
      setCheckingRegistration(false);
    }
  }, [id, user]);

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id, fetchEvent]);

  useEffect(() => {
    if (id && user && user.role === 'student') {
      checkRegistrationStatus();
    }
  }, [id, user, checkRegistrationStatus]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast('Event link copied to clipboard!', 'success');
    }
  };

  // Student Register Action
  const handleRegister = async () => {
    if (!user) {
      navigate(`/login?redirect=/events/${id}`);
      return;
    }

    if (user.role !== 'student') {
      addToast('Only student accounts can register for campus events.', 'warning');
      return;
    }

    setIsRegistering(true);
    try {
      const res = await apiClient.post('/registrations', { eventId: id });
      const reg = res.data;
      setIsRegistered(true);
      setMyRegistration(reg);
      setEvent((prev) => (prev ? { ...prev, registeredCount: (prev.registeredCount || 0) + 1 } : prev));
      addToast('Registration confirmed! Your entrance pass is ready.', 'success');
      setIsTicketOpen(true);
    } catch (err) {
      console.error('Registration failed:', err);
      addToast(err.message || 'Unable to register for event.', 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  // Cancel Registration
  const handleCancelRegistration = async () => {
    if (!myRegistration) return;
    setIsCancelling(true);
    try {
      await apiClient.patch(`/registrations/${myRegistration._id}/cancel`);
      setIsRegistered(false);
      setMyRegistration(null);
      setEvent((prev) =>
        prev ? { ...prev, registeredCount: Math.max(0, (prev.registeredCount || 1) - 1) } : prev
      );
      addToast('Your registration has been cancelled.', 'info');
      setIsCancelOpen(false);
    } catch (err) {
      console.error('Cancellation error:', err);
      addToast(err.message || 'Failed to cancel registration.', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
        <SkeletonLoader height="320px" className="rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <SkeletonLoader height="36px" width="60%" />
            <SkeletonLoader height="20px" width="40%" />
            <SkeletonLoader height="120px" />
          </div>
          <div className="space-y-4">
            <SkeletonLoader height="200px" className="rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Event Unavailable</h2>
        <p className="text-sm text-slate-400">{error || 'The requested event could not be found.'}</p>
        <Link to="/events">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Events Catalog</span>
          </Button>
        </Link>
      </div>
    );
  }

  const now = new Date();
  const eventDate = new Date(event.date);
  const deadline = new Date(event.registrationDeadline);
  const isPast = eventDate < now;
  const isDeadlinePassed = deadline < now;
  const isFull = (event.registeredCount || 0) >= (event.capacity || 1);
  const availableSeats = Math.max(0, (event.capacity || 0) - (event.registeredCount || 0));
  const utilization = Math.min(100, Math.round(((event.registeredCount || 0) / (event.capacity || 1)) * 100));

  const isOrganizerOfEvent =
    user && (user.role === 'admin' || (event.organizer && event.organizer._id === user._id));

  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedDeadline = deadline.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Back button */}
      <div>
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Events</span>
        </Link>
      </div>

      {/* Banner & Header Card */}
      <div className="relative rounded-3xl overflow-hidden glass-card border border-slate-800 shadow-2xl">
        <div className="relative h-72 sm:h-96 w-full bg-slate-900 overflow-hidden">
          {event.bannerImage ? (
            <img
              src={event.bannerImage}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-indigo-950 via-slate-900 to-purple-950 text-slate-600">
              <Calendar className="w-20 h-20 opacity-30" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Top Chips */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between gap-3">
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-950/80 text-white backdrop-blur border border-white/10 shadow-lg">
              {event.category}
            </span>

            <button
              type="button"
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white backdrop-blur border border-white/10 transition shadow-lg"
              title="Share Event"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Title & Metadata */}
          <div className="absolute bottom-6 left-6 right-6 space-y-2">
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              {event.title}
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-medium text-slate-300">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400" />
                {event.startTime} - {event.endTime}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-400" />
                {event.venue}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Description & Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* About Section */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>About the Event</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Target Audience & Tags */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Target Audience & Eligibility
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <Building className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="text-slate-400 block">Department</span>
                  <span className="font-semibold text-slate-200">
                    {event.targetDepartment === 'All'
                      ? 'Open to All Departments'
                      : event.targetDepartment}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="text-slate-400 block">Academic Year</span>
                  <span className="font-semibold text-slate-200">
                    {!event.targetYear || event.targetYear.length === 0
                      ? 'All Academic Years (1–4)'
                      : `Year(s): ${event.targetYear.join(', ')}`}
                  </span>
                </div>
              </div>
            </div>

            {event.tags && event.tags.length > 0 && (
              <div className="pt-2">
                <span className="text-slate-400 block text-xs mb-2 font-medium">Topic Tags:</span>
                <div className="flex flex-wrap gap-1.5">
                  {event.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/80 flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3 text-indigo-400" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ratings & Reviews Section */}
          <EventReviewsSection event={event} />
        </div>

        {/* Right Column: Registration Card */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6 shadow-xl sticky top-24">
            {/* Status / Confirmation Banner */}
            {isRegistered ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>You're Confirmed!</span>
                </div>
                <p className="text-xs text-slate-300">
                  Your seat is reserved. Bring your digital pass or ticket code to campus check-in.
                </p>
                {myRegistration?.ticketCode && (
                  <div className="pt-1 font-mono text-xs font-bold text-emerald-300 tracking-wider">
                    Pass: {myRegistration.ticketCode}
                  </div>
                )}
              </div>
            ) : null}

            {/* Capacity Meter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Available Seats</span>
                <span className={`font-bold ${isFull ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isFull ? 'Fully Booked' : `${availableSeats} / ${event.capacity} seats`}
                </span>
              </div>

              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isFull ? 'bg-rose-500' : utilization > 80 ? 'bg-amber-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${utilization}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500">
                {event.registeredCount || 0} students confirmed
              </p>
            </div>

            {/* Registration Deadline */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
              <Hourglass className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <span className="text-slate-400 block">Registration Deadline</span>
                <span
                  className={`font-semibold ${
                    isDeadlinePassed ? 'text-rose-400' : 'text-slate-200'
                  }`}
                >
                  {formattedDeadline} {isDeadlinePassed ? '(Expired)' : ''}
                </span>
              </div>
            </div>

            {/* Dynamic Action Buttons */}
            <div className="space-y-2">
              {isOrganizerOfEvent && (
                <Link to={`/organizer/attendance?eventId=${event._id}`}>
                  <Button variant="secondary" fullWidth className="gap-2 mb-2">
                    <ClipboardList className="w-4 h-4 text-indigo-400" />
                    <span>Manage Participants & Attendance</span>
                  </Button>
                </Link>
              )}

              {isRegistered ? (
                <>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => setIsTicketOpen(true)}
                    className="gap-2 shadow-lg shadow-indigo-600/25"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>View Entrance Pass</span>
                  </Button>

                  {!isPast && (
                    <Button
                      variant="ghost"
                      fullWidth
                      onClick={() => setIsCancelOpen(true)}
                      className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                    >
                      Cancel My Registration
                    </Button>
                  )}
                </>
              ) : isPast ? (
                <Button variant="outline" fullWidth disabled>
                  Event Concluded
                </Button>
              ) : isDeadlinePassed ? (
                <Button variant="outline" fullWidth disabled>
                  Registration Closed
                </Button>
              ) : isFull ? (
                <Button variant="outline" fullWidth disabled>
                  Capacity Full
                </Button>
              ) : (
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleRegister}
                  disabled={isRegistering || checkingRegistration}
                  className="shadow-lg shadow-indigo-600/25"
                >
                  {isRegistering ? 'Reserving Seat...' : 'Register for Event'}
                </Button>
              )}
            </div>

            <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official College Sanctioned Event</span>
            </p>
          </div>

          {/* Organizer Details */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>Event Coordinator</span>
            </h3>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {event.organizer?.name ? event.organizer.name.charAt(0).toUpperCase() : 'O'}
              </div>
              <div className="text-xs">
                <h4 className="text-white font-bold">{event.organizer?.name || 'Faculty Coordinator'}</h4>
                <p className="text-slate-400">{event.organizer?.department || 'Academic Affairs'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      <TicketModal
        isOpen={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
        registration={
          myRegistration
            ? { ...myRegistration, event, student: user }
            : null
        }
      />

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleCancelRegistration}
        title="Cancel Event Registration?"
        message={`Are you sure you want to cancel your seat for "${event.title}"? Your ticket code will be invalidated.`}
        confirmText="Confirm Cancellation"
        variant="danger"
        isLoading={isCancelling}
      />
    </div>
  );
};

export default EventDetailPage;
