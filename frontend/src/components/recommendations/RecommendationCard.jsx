import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowRight,
  Sparkles,
  GraduationCap,
  CheckCircle2,
  Tag,
  Award
} from 'lucide-react';
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

const getReasonIcon = (reasonText) => {
  const lower = reasonText.toLowerCase();
  if (lower.includes('curriculum') || lower.includes('department')) {
    return <GraduationCap className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />;
  }
  if (lower.includes('year') || lower.includes('academic')) {
    return <Award className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />;
  }
  if (lower.includes('skill') || lower.includes('tag')) {
    return <Tag className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />;
  }
  if (lower.includes('attended') || lower.includes('rated') || lower.includes('similar')) {
    return <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
  }
  if (lower.includes('interest') || lower.includes('popular') || lower.includes('seats')) {
    return <Users className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />;
  }
  return <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />;
};

export const RecommendationCard = ({ recommendation }) => {
  if (!recommendation || !recommendation.event) return null;

  const { event, score, reasons = [], availableSeats = 0, isFull = false, isRegistered = false } = recommendation;

  const categoryColor = CATEGORY_COLORS[event.category] || 'primary';

  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'TBD';

  // Dynamic Score Badge Styling
  const getScoreBadge = () => {
    if (score >= 80) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wide bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {score}% Match
        </span>
      );
    }
    if (score >= 60) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-gradient-to-r from-indigo-500/20 to-sky-500/20 text-indigo-300 border border-indigo-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          {score}% Match
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-slate-800 text-slate-300 border border-slate-700">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        {score}% Match
      </span>
    );
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col group h-full border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5">
      {/* Banner & Visual Header */}
      <div className="relative h-44 bg-gradient-to-tr from-slate-950 via-indigo-950/60 to-slate-900 overflow-hidden flex items-center justify-center p-4 border-b border-slate-800/80">
        {event.bannerImage ? (
          <img
            src={event.bannerImage}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-slate-900/40 to-slate-950 pointer-events-none" />
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2">
          <Badge variant={categoryColor} size="sm">
            {event.category}
          </Badge>
          {event.targetDepartment && event.targetDepartment !== 'All' && (
            <Badge variant="neutral" size="sm">
              {event.targetDepartment}
            </Badge>
          )}
        </div>

        {/* Score Pill in Top Right */}
        <div className="absolute top-3 right-3 z-10">
          {getScoreBadge()}
        </div>

        {/* Date and Time Strip */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-slate-300 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5">
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

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold text-white tracking-tight line-clamp-2 group-hover:text-indigo-300 transition-colors">
              {event.title}
            </h3>
          </div>

          <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
            {event.description}
          </p>

          {/* Location and Seats */}
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate font-medium">{event.venue}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{availableSeats} seats left</span>
            </div>
          </div>

          {/* Why Recommended / Factual Reasons */}
          {reasons && reasons.length > 0 && (
            <div className="mt-4 pt-3.5 border-t border-slate-800/80">
              <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Why this event?
              </p>
              <div className="space-y-1.5">
                {reasons.slice(0, 3).map((reason, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-slate-300 bg-slate-950/50 border border-slate-800/70 rounded-xl px-2.5 py-1.5 flex items-start gap-2 leading-relaxed"
                  >
                    {getReasonIcon(reason)}
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          {isRegistered ? (
            <Badge variant="success" size="sm" hasDot className="py-1 px-2.5">
              Already Registered
            </Badge>
          ) : isFull ? (
            <Badge variant="danger" size="sm" className="py-1 px-2.5">
              Event Full
            </Badge>
          ) : (
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Open for Registration
            </span>
          )}

          <Link to={`/events/${event._id}`} className="shrink-0">
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              {isRegistered ? 'View Ticket' : 'View Details'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;
