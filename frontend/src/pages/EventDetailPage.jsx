import { useState, useEffect } from 'react';
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
  Hourglass
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import apiClient from '../services/apiClient';

export const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(`/events/${id}`);
        setEvent(res.data.data);
      } catch (err) {
        console.error('Failed to load event details:', err);
        setError(err.response?.data?.message || 'Event not found or unavailable.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast('Event link copied to clipboard!', 'success');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in pb-12">
        <SkeletonLoader height="320px" className="rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <SkeletonLoader height="40px" width="80%" />
            <SkeletonLoader height="20px" count={4} />
          </div>
          <div>
            <SkeletonLoader height="280px" className="rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-xl mx-auto my-16 glass-card rounded-2xl p-8 border border-slate-800 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Event Unavailable</h2>
        <p className="text-sm text-slate-400">{error || 'The requested event could not be found.'}</p>
        <Button variant="primary" onClick={() => navigate('/events')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Events Catalog
        </Button>
      </div>
    );
  }

  const availableSeats = Math.max(0, (event.capacity || 0) - (event.registeredCount || 0));
  const isFull = availableSeats === 0;
  const utilization = Math.min(
    100,
    Math.round(((event.registeredCount || 0) / Math.max(1, event.capacity || 1)) * 100)
  );

  const eventDate = new Date(event.date);
  const formattedEventDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const deadlineDate = new Date(event.registrationDeadline);
  const formattedDeadline = deadlineDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const isDeadlinePassed = new Date() > deadlineDate;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            leftIcon={<Share2 className="w-4 h-4" />}
          >
            Share
          </Button>
          {(user?.role === 'admin' || user?._id === event.organizer?._id) && (
            <Link to={`/organizer/events`}>
              <Button variant="neutral" size="sm">
                Manage Event
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Hero Visual Card */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="h-72 sm:h-96 w-full relative overflow-hidden bg-gradient-to-tr from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center">
          {event.bannerImage ? (
            <img
              src={event.bannerImage}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-slate-950" />
          )}

          {/* Badges Overlay */}
          <div className="absolute top-6 left-6 flex flex-wrap gap-2 z-10">
            <Badge variant="purple" size="md">
              {event.category}
            </Badge>
            {event.targetDepartment && event.targetDepartment !== 'All' && (
              <Badge variant="neutral" size="md">
                {event.targetDepartment}
              </Badge>
            )}
            {event.status === 'approved' && (
              <Badge variant="success" size="md" hasDot>
                Approved Event
              </Badge>
            )}
            {event.status === 'pending' && (
              <Badge variant="warning" size="md" hasDot>
                Pending Review
              </Badge>
            )}
            {event.status === 'draft' && (
              <Badge variant="neutral" size="md">
                Draft
              </Badge>
            )}
            {event.status === 'rejected' && (
              <Badge variant="danger" size="md" hasDot>
                Rejected / Needs Revision
              </Badge>
            )}
          </div>
        </div>

        {/* Title & Quick Info Ribbon */}
        <div className="p-6 sm:p-8 bg-slate-900/90 backdrop-blur-md border-t border-slate-800/80">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            {event.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-slate-300">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              {formattedEventDate}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              {event.startTime} – {event.endTime}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400" />
              {event.venue}
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Description, Agenda, Tags */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Event */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800/80 space-y-4">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>About this Event</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Tags & Skills */}
          {event.tags && event.tags.length > 0 && (
            <div className="glass-card rounded-2xl p-6 border border-slate-800/80 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-400" />
                <span>Associated Topics & Skills</span>
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {event.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Target Audience Information */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>Target Audience & Eligibility</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 block">Eligible Department(s)</span>
                <span className="text-slate-200 font-semibold text-sm">
                  {event.targetDepartment || 'All Campus Departments'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 block">Eligible Academic Years</span>
                <div className="flex gap-1.5 pt-0.5">
                  {event.targetYear && event.targetYear.length > 0 ? (
                    event.targetYear.map((yr) => (
                      <span
                        key={yr}
                        className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-semibold text-xs"
                      >
                        Year {yr}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-200 font-semibold">Open to All Years</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Registration Card & Organizer Details */}
        <div className="space-y-6">
          {/* Booking & Capacity Card */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800/80 space-y-5">
            <h3 className="text-base font-bold text-white tracking-tight">Registration Status</h3>

            {/* Capacity Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>Available Seats:</span>
                </span>
                <span className={`font-bold ${isFull ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isFull ? 'Fully Booked' : `${availableSeats} / ${event.capacity}`}
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
                {event.registeredCount || 0} students currently confirmed
              </p>
            </div>

            {/* Deadline */}
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

            {/* Action Button */}
            {isDeadlinePassed ? (
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
                onClick={() => {
                  addToast(
                    'Event registration will be activated in Phase 5 (Registration & Attendance)!',
                    'info'
                  );
                }}
              >
                Register for Event
              </Button>
            )}

            <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Official College Sanctioned Event
            </p>
          </div>

          {/* Organizer Card */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>Event Coordinator</span>
            </h3>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {event.organizer?.name ? event.organizer.name.charAt(0).toUpperCase() : 'O'}
              </div>
              <div className="text-xs">
                <h4 className="text-white font-bold">{event.organizer?.name || 'Department Faculty'}</h4>
                <p className="text-slate-400">{event.organizer?.department || 'Academic Affairs'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
