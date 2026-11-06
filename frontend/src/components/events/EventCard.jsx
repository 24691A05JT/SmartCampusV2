import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, ArrowRight, Building, CheckCircle2 } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';

const CATEGORY_COLORS = {
  Technical: 'purple',
  Workshop: 'info',
  Cultural: 'warning',
  Sports: 'success',
  Seminar: 'primary',
  Hackathon: 'danger',
  Webinar: 'sky',
  Career: 'emerald'
};

export const EventCard = ({ event, isOrganizerView = false, onEdit, onDelete, onSubmit }) => {
  if (!event) return null;

  const categoryColor = CATEGORY_COLORS[event.category] || 'primary';
  const availableSeats = Math.max(0, (event.capacity || 0) - (event.registeredCount || 0));
  const utilization = Math.min(100, Math.round(((event.registeredCount || 0) / Math.max(1, event.capacity || 1)) * 100));

  const formattedDate = event.date ? new Date(event.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : 'TBD';

  const isFull = availableSeats === 0;

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col group h-full">
      {/* Banner / Header Visual */}
      <div className="relative h-44 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 overflow-hidden flex items-center justify-center p-4 border-b border-slate-800">
        {event.bannerImage ? (
          <img
            src={event.bannerImage}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-slate-950 pointer-events-none" />
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 z-10 flex gap-2">
          <Badge variant={categoryColor} size="sm">
            {event.category}
          </Badge>
          {event.targetDepartment && event.targetDepartment !== 'All' && (
            <Badge variant="neutral" size="sm">
              {event.targetDepartment}
            </Badge>
          )}
        </div>

        <div className="absolute top-3 right-3 z-10">
          {event.status === 'approved' && (
            <Badge variant="success" size="sm" hasDot>Approved</Badge>
          )}
          {event.status === 'pending' && (
            <Badge variant="warning" size="sm" hasDot>Pending Review</Badge>
          )}
          {event.status === 'draft' && (
            <Badge variant="neutral" size="sm">Draft</Badge>
          )}
          {event.status === 'rejected' && (
            <Badge variant="danger" size="sm" hasDot>Needs Revision</Badge>
          )}
        </div>

        {/* Bottom Banner Stats */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-slate-300 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            {event.startTime} – {event.endTime}
          </span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight line-clamp-2 group-hover:text-indigo-300 transition-colors">
            {event.title}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
            {event.description}
          </p>

          <div className="mt-3.5 space-y-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate font-medium">{event.venue}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate text-slate-400">
                Organized by: <strong className="text-slate-200">{event.organizer?.name || 'Faculty'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Capacity / Available Seats Progress */}
        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Available Seats:</span>
            </span>
            <span className={`font-semibold ${isFull ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isFull ? 'Fully Booked' : `${availableSeats} of ${event.capacity}`}
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={event.registeredCount || 0}
            aria-valuemin={0}
            aria-valuemax={event.capacity || 100}
            aria-valuetext={`${event.registeredCount || 0} of ${event.capacity || 0} seats booked`}
            aria-label={`Event capacity: ${utilization}% booked`}
            className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isFull ? 'bg-rose-500' : utilization > 80 ? 'bg-amber-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${utilization}%` }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-between gap-2">
          {isOrganizerView ? (
            <div className="flex items-center justify-between w-full gap-2">
              {event.status === 'draft' && onSubmit && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onSubmit(event)}
                >
                  Submit
                </Button>
              )}
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(event)}
                >
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                  onClick={() => onDelete(event)}
                >
                  Delete
                </Button>
              )}
              <Link
                to={`/events/${event._id}`}
                className="ml-auto inline-flex items-center justify-center text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-transparent hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-slate-500 outline-none"
                aria-label={`View details for ${event.title}`}
              >
                Details
              </Link>
            </div>
          ) : (
            <Link
              to={`/events/${event._id}`}
              className={`relative inline-flex items-center justify-center w-full transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-[0.98] font-medium text-sm px-4 py-2.5 rounded-xl gap-2 cursor-pointer ${
                isFull
                  ? 'bg-transparent hover:bg-white/5 text-slate-200 border border-slate-700 hover:border-slate-500 focus-visible:ring-indigo-500'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500/30 focus-visible:ring-indigo-500'
              }`}
              aria-label={isFull ? `View details for fully booked event ${event.title}` : `View details and register for ${event.title}`}
            >
              <span>{isFull ? 'View Event Details' : 'View & Register'}</span>
              <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
