import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import { Calendar, Ticket, Award, Sparkles, Compass, Clock, ArrowRight } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { Link } from 'react-router-dom';

export const StudentDashboard = () => {
  const { user } = useAuth();

  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const [totalEligible, setTotalEligible] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchTopRecommendations = async () => {
      try {
        setRecLoading(true);
        const res = await apiClient.get('/recommendations', { params: { limit: 3 } });
        if (isMounted) {
          const items = Array.isArray(res.data) ? res.data : res.data?.recommendations || [];
          setRecommendations(items);
          setTotalEligible(res.meta?.totalEligible ?? items.length);
        }
      } catch (err) {
        console.warn('Could not load student recommendations snapshot:', err);
      } finally {
        if (isMounted) setRecLoading(false);
      }
    };

    fetchTopRecommendations();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <Badge variant="primary" size="sm" hasDot className="mb-3">
            Academic Session 2026
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Welcome back, {user?.name || 'Student'}!
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            Explore newly approved campus hackathons, technical seminars, and co-curricular activities tailored to your <strong className="text-white">{user?.department || 'Department'}</strong> curriculum.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/events">
              <Button variant="primary" size="md" leftIcon={<Compass className="w-4 h-4" />}>
                Browse All Events
              </Button>
            </Link>
            <Link to="/student/recommendations">
              <Button variant="glass" size="md" leftIcon={<Sparkles className="w-4 h-4" />}>
                AI Recommendations
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Registrations"
          value="3"
          icon={Ticket}
          trend="+1 this week"
          accentColor="indigo"
        />
        <StatCard
          title="Events Attended"
          value="8"
          icon={Calendar}
          trend="89% attendance"
          accentColor="emerald"
        />
        <StatCard
          title="Certificates Earned"
          value="6"
          icon={Award}
          trend="Verifiable PDF"
          accentColor="rose"
        />
        <StatCard
          title="Recommended Matches"
          value={String(totalEligible)}
          icon={Sparkles}
          trend="Personalized matches"
          accentColor="sky"
        />
      </div>

      {/* Main Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Registered Events (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Your Upcoming Registered Events"
            subtitle="Confirmed reservations with attendance tickets"
            headerAction={
              <Link to="/student/registrations">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  View All
                </Button>
              </Link>
            }
          >
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-700">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex flex-col items-center justify-center font-bold shrink-0">
                    <span className="text-[10px] uppercase">Nov</span>
                    <span className="text-base leading-none">12</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="purple" size="sm">Technical Workshop</Badge>
                      <Badge variant="success" size="sm">Confirmed</Badge>
                    </div>
                    <h4 className="text-base font-bold text-white">Full-Stack Cloud & DevOps Conclave</h4>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                      <span>Venue: Seminar Hall 2</span>
                      <span>•</span>
                      <span>10:00 AM – 01:00 PM</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    View Ticket
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-700">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex flex-col items-center justify-center font-bold shrink-0">
                    <span className="text-[10px] uppercase">Nov</span>
                    <span className="text-base leading-none">18</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="info" size="sm">Hackathon</Badge>
                      <Badge variant="success" size="sm">Confirmed</Badge>
                    </div>
                    <h4 className="text-base font-bold text-white">Campus 24-Hour AI Innovation Hackathon</h4>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                      <span>Venue: Innovation Hub</span>
                      <span>•</span>
                      <span>09:00 AM – 09:00 AM</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    View Ticket
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* AI Recommendations Snapshot (Right col) */}
        <div className="space-y-6">
          <Card
            title="Top AI Recommendations"
            subtitle="Content-based match for your profile"
            headerAction={
              <Link to="/student/recommendations">
                <Button variant="ghost" size="sm">
                  Explore
                </Button>
              </Link>
            }
          >
            {recLoading ? (
              <div className="space-y-3">
                <SkeletonLoader height="90px" className="rounded-2xl" />
                <SkeletonLoader height="90px" className="rounded-2xl" />
              </div>
            ) : recommendations.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-950/40 rounded-2xl border border-slate-800">
                <p>No upcoming matches found.</p>
                <Link to="/events" className="mt-2 inline-block text-indigo-400 hover:text-indigo-300 font-semibold">
                  Browse all events &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.slice(0, 2).map((rec) => {
                  const eventDate = rec.event?.date
                    ? new Date(rec.event.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'Upcoming';

                  return (
                    <div
                      key={rec.event._id}
                      className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl hover:border-indigo-500/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge
                          variant={rec.score >= 80 ? 'success' : rec.score >= 60 ? 'primary' : 'neutral'}
                          size="sm"
                          hasDot
                        >
                          {rec.score}% Match
                        </Badge>
                        <span className="text-[11px] text-indigo-400 font-semibold truncate max-w-[130px]">
                          {rec.event.category}
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-white line-clamp-1">{rec.event.title}</h5>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                        {rec.reasons?.[0] ? `"${rec.reasons[0]}"` : rec.event.description}
                      </p>
                      <div className="mt-3 pt-3 border-t border-indigo-500/10 flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          {eventDate} • {rec.event.startTime || 'TBD'}
                        </span>
                        <Link to={`/events/${rec.event._id}`}>
                          <span className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                            Details <ArrowRight className="w-3 h-3" />
                          </span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
