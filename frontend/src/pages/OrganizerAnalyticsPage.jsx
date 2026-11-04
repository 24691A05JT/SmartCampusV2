import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import {
  BarChart3,
  Users,
  Percent,
  Star,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  PlusCircle,
  ClipboardCheck
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import SkeletonLoader from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';
import EventPerformanceBarChart from '../components/analytics/EventPerformanceBarChart';
import CategoryPieChart from '../components/analytics/CategoryPieChart';
import ParticipationTrendChart from '../components/analytics/ParticipationTrendChart';
import { Link } from 'react-router-dom';

export const OrganizerAnalyticsPage = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const res = await apiClient.get('/analytics/organizer');
      setAnalytics(res.data);
    } catch (err) {
      console.warn('Failed to load organizer analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const summary = analytics?.summary || {
    totalEvents: 0,
    approvedEvents: 0,
    pendingEvents: 0,
    totalRegistrations: 0,
    totalCapacity: 0,
    capacityUtilizationRate: 0,
    turnoutRate: 0,
    totalPresentAttendees: 0,
    totalReviews: 0,
    averageRating: 0
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl">
        <div>
          <Badge variant="warning" size="sm" hasDot className="mb-2">
            Organizer Performance Intelligence
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Event & Engagement Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Faculty organizer: <span className="text-white font-medium">{user?.name}</span> • {user?.department || 'Department'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
            onClick={fetchAnalytics}
            disabled={refreshing}
          >
            Refresh
          </Button>
          <Link to="/organizer/events/new">
            <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Create Event
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Capacity Utilization"
          value={loading ? '...' : `${summary.capacityUtilizationRate}%`}
          icon={Percent}
          trend={`${summary.totalRegistrations} of ${summary.totalCapacity} total seats filled`}
          accentColor="indigo"
        />
        <StatCard
          title="Attendance Turnout"
          value={loading ? '...' : `${summary.turnoutRate}%`}
          icon={Users}
          trend={`${summary.totalPresentAttendees} verified attendees`}
          accentColor="emerald"
        />
        <StatCard
          title="Total Events"
          value={loading ? '...' : String(summary.totalEvents)}
          icon={Calendar}
          trend={`${summary.approvedEvents} approved • ${summary.pendingEvents} pending`}
          accentColor="sky"
        />
        <StatCard
          title="Average Rating"
          value={loading ? '...' : `${summary.averageRating} ★`}
          icon={Star}
          trend={summary.totalReviews > 0 ? `From ${summary.totalReviews} attendee reviews` : 'No reviews yet'}
          accentColor="amber"
        />
      </div>

      {/* Primary Analytics Grid: Performance Comparison & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Event Performance Clustered Bars */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Event Capacity, Booking & Attendance Performance"
            subtitle="Comparing venue capacity, registered student counts, and verified attendance"
          >
            {loading ? (
              <SkeletonLoader height="280px" className="rounded-2xl" />
            ) : (
              <EventPerformanceBarChart
                data={analytics?.eventPerformance || []}
                height={280}
              />
            )}
          </Card>
        </div>

        {/* Right Col: Category Distribution */}
        <div className="space-y-6">
          <Card
            title="Event Category Portfolio"
            subtitle="Distribution of event formats organized"
          >
            {loading ? (
              <SkeletonLoader height="280px" className="rounded-2xl" />
            ) : (
              <CategoryPieChart
                data={analytics?.categoryDistribution || []}
                height={280}
              />
            )}
          </Card>
        </div>
      </div>

      {/* Secondary Analytics Grid: Monthly Registration Velocity */}
      <Card
        title="Monthly Registration Velocity"
        subtitle="6-month trend of student reservations across your organized events"
      >
        {loading ? (
          <SkeletonLoader height="240px" className="rounded-2xl" />
        ) : (
          <ParticipationTrendChart
            data={analytics?.monthlyTrend || []}
            series={[
              { key: 'registrations', name: 'Event Registrations', color: '#38bdf8' }
            ]}
            height={240}
          />
        )}
      </Card>

      {/* Event Performance Audit Table */}
      <Card
        title="Event Roster Performance Summary"
        subtitle="Individual event throughput, capacity ratios, and status"
        headerAction={
          <Link to="/organizer/events">
            <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight className="w-4 h-4" />}>
              Manage All Events
            </Button>
          </Link>
        }
      >
        {loading ? (
          <div className="space-y-3">
            <SkeletonLoader height="50px" className="rounded-xl" />
            <SkeletonLoader height="50px" className="rounded-xl" />
            <SkeletonLoader height="50px" className="rounded-xl" />
          </div>
        ) : !analytics?.eventPerformance || analytics.eventPerformance.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No Events Found"
            description="You have not created any campus events yet. Create your first event to see performance data."
            className="py-10"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Event Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4">Attended</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {analytics.eventPerformance.map((ev) => {
                  const evDate = ev.date
                    ? new Date(ev.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'TBD';

                  const utilization = ev.capacity > 0 ? Math.round((ev.registeredCount / ev.capacity) * 100) : 0;

                  return (
                    <tr key={ev._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {ev.title}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="purple" size="sm">{ev.category}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        {evDate}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        {ev.capacity} seats
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="font-semibold text-white">{ev.registeredCount}</span>
                        <span className="text-slate-400 text-[11px] ml-1">({utilization}%)</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="font-semibold text-emerald-400">{ev.presentCount}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={ev.isCancelled ? 'danger' : ev.status === 'approved' ? 'success' : ev.status === 'pending' ? 'warning' : 'neutral'}
                          size="sm"
                          hasDot
                        >
                          {ev.isCancelled ? 'Cancelled' : ev.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link to="/organizer/attendance">
                          <Button variant="outline" size="sm" leftIcon={<ClipboardCheck className="w-3.5 h-3.5" />}>
                            Attendance
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OrganizerAnalyticsPage;
