import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import {
  Calendar,
  Ticket,
  Award,
  Sparkles,
  Compass,
  Clock,
  ArrowRight,
  TrendingUp,
  PieChart as PieIcon,
  CheckCircle2,
  MapPin
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import SkeletonLoader from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';
import CategoryPieChart from '../components/analytics/CategoryPieChart';
import ParticipationTrendChart from '../components/analytics/ParticipationTrendChart';
import { Link } from 'react-router-dom';

export const StudentDashboard = () => {
  const { user } = useAuth();

  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const [totalEligible, setTotalEligible] = useState(0);

  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        setRecLoading(true);
        setAnalyticsLoading(true);

        const [recRes, analyticsRes] = await Promise.allSettled([
          apiClient.get('/recommendations', { params: { limit: 3 } }),
          apiClient.get('/analytics/student')
        ]);

        if (isMounted) {
          if (recRes.status === 'fulfilled') {
            const items = Array.isArray(recRes.value.data)
              ? recRes.value.data
              : recRes.value.data?.recommendations || [];
            setRecommendations(items);
            setTotalEligible(recRes.value.meta?.totalEligible ?? items.length);
          }

          if (analyticsRes.status === 'fulfilled') {
            setAnalytics(analyticsRes.value.data);
          }
        }
      } catch (err) {
        console.warn('Could not load student dashboard data:', err);
      } finally {
        if (isMounted) {
          setRecLoading(false);
          setAnalyticsLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = analytics?.summary || {
    activeRegistrations: 0,
    eventsAttended: 0,
    attendanceRate: 0,
    certificatesEarned: 0
  };

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
          value={analyticsLoading ? '...' : String(summary.activeRegistrations)}
          icon={Ticket}
          trend={summary.activeRegistrations > 0 ? `${summary.activeRegistrations} confirmed` : 'No upcoming bookings'}
          accentColor="indigo"
        />
        <StatCard
          title="Events Attended"
          value={analyticsLoading ? '...' : String(summary.eventsAttended)}
          icon={Calendar}
          trend={summary.eventsAttended > 0 ? `${summary.attendanceRate}% turnout rate` : 'Turnout metric'}
          accentColor="emerald"
        />
        <StatCard
          title="Certificates Earned"
          value={analyticsLoading ? '...' : String(summary.certificatesEarned)}
          icon={Award}
          trend="Verifiable PDF"
          accentColor="rose"
        />
        <StatCard
          title="Recommended Matches"
          value={recLoading ? '...' : String(totalEligible)}
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
            subtitle="Confirmed reservations with attendance boarding passes"
            headerAction={
              <Link to="/student/registrations">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  View All
                </Button>
              </Link>
            }
          >
            {analyticsLoading ? (
              <div className="space-y-3">
                <SkeletonLoader height="80px" className="rounded-2xl" />
                <SkeletonLoader height="80px" className="rounded-2xl" />
              </div>
            ) : !analytics?.recentParticipation || analytics.recentParticipation.length === 0 ? (
              <EmptyState
                icon={Ticket}
                title="No Active Event Registrations"
                description="You have not reserved seats for upcoming campus events yet. Explore events and reserve your pass."
                action={
                  <Link to="/events">
                    <Button variant="primary" size="sm">
                      Explore Campus Events
                    </Button>
                  </Link>
                }
                className="py-10"
              />
            ) : (
              <div className="space-y-3">
                {analytics.recentParticipation.map((item) => {
                  const evDate = item.event?.date ? new Date(item.event.date) : null;
                  const monthName = evDate ? evDate.toLocaleString('en-US', { month: 'short' }) : 'UPC';
                  const dayNum = evDate ? evDate.getDate() : '--';

                  return (
                    <div
                      key={item.registrationId}
                      className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-700"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex flex-col items-center justify-center font-bold shrink-0">
                          <span className="text-[10px] uppercase">{monthName}</span>
                          <span className="text-base leading-none">{dayNum}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="purple" size="sm">{item.event.category}</Badge>
                            <Badge
                              variant={item.attendanceStatus === 'present' ? 'success' : 'info'}
                              size="sm"
                              hasDot
                            >
                              {item.attendanceStatus === 'present' ? 'Attended' : 'Confirmed'}
                            </Badge>
                          </div>
                          <h4 className="text-sm font-bold text-white line-clamp-1">
                            {item.event.title}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {item.event.venue}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {item.event.startTime || '10:00'}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <Link to="/student/registrations">
                          <Button variant="outline" size="sm">
                            View Ticket
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

      {/* Engagement Analytics Section (Interactive Recharts Visualizations) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card
          title="Monthly Activity & Participation Trend"
          subtitle="6-month timeline of your event registrations vs attended sessions"
        >
          {analyticsLoading ? (
            <SkeletonLoader height="260px" className="rounded-2xl" />
          ) : (
            <ParticipationTrendChart
              data={analytics?.monthlyActivity || []}
              series={[
                { key: 'registrations', name: 'Registrations', color: '#6366f1' },
                { key: 'attended', name: 'Attended', color: '#10b981' }
              ]}
              height={260}
            />
          )}
        </Card>

        <Card
          title="Co-Curricular Category Breakdown"
          subtitle="Distribution of event categories across your campus participation"
        >
          {analyticsLoading ? (
            <SkeletonLoader height="260px" className="rounded-2xl" />
          ) : (
            <CategoryPieChart
              data={analytics?.categoryDistribution || []}
              height={260}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
