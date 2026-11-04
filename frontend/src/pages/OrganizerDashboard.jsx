import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import {
  Calendar,
  Users,
  ClipboardCheck,
  PlusCircle,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  BarChart3,
  Star
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import SkeletonLoader from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';
import { Link } from 'react-router-dom';

export const OrganizerDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardAnalytics = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/analytics/organizer');
        if (isMounted) {
          setAnalytics(res.data);
        }
      } catch (err) {
        console.warn('Could not load organizer dashboard metrics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardAnalytics();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = analytics?.summary || {
    totalEvents: 0,
    approvedEvents: 0,
    pendingEvents: 0,
    totalRegistrations: 0,
    totalCapacity: 0,
    capacityUtilizationRate: 0,
    averageRating: 0,
    totalReviews: 0
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl">
        <div>
          <Badge variant="warning" size="sm" hasDot className="mb-2">
            Faculty & Organizer Workspace
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Event Management Console
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Organized by: <span className="text-white font-medium">{user?.name}</span> • {user?.department || 'Faculty'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/organizer/events/new">
            <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Create New Event
            </Button>
          </Link>
          <Link to="/organizer/analytics">
            <Button variant="glass" size="md" leftIcon={<BarChart3 className="w-4 h-4" />}>
              View Analytics
            </Button>
          </Link>
          <Link to="/organizer/attendance">
            <Button variant="outline" size="md" leftIcon={<ClipboardCheck className="w-4 h-4" />}>
              Mark Attendance
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Events Managed"
          value={loading ? '...' : String(summary.totalEvents)}
          icon={Calendar}
          trend={`${summary.approvedEvents} approved • ${summary.pendingEvents} pending`}
          accentColor="indigo"
        />
        <StatCard
          title="Total Registrations"
          value={loading ? '...' : String(summary.totalRegistrations)}
          icon={Users}
          trend={`${summary.capacityUtilizationRate}% capacity utilization`}
          accentColor="emerald"
        />
        <StatCard
          title="Pending Approvals"
          value={loading ? '...' : String(summary.pendingEvents)}
          icon={AlertCircle}
          trend={summary.pendingEvents > 0 ? 'Awaiting admin review' : 'No pending submissions'}
          accentColor="amber"
        />
        <StatCard
          title="Avg Event Rating"
          value={loading ? '...' : `${summary.averageRating} ★`}
          icon={Star}
          trend={summary.totalReviews > 0 ? `From ${summary.totalReviews} reviews` : 'No reviews yet'}
          accentColor="rose"
        />
      </div>

      {/* Active Events Table / List */}
      <Card
        title="Your Scheduled Campus Events"
        subtitle="Manage registrations, check capacity, and mark student attendance"
        headerAction={
          <div className="flex items-center gap-3">
            <Link to="/organizer/analytics">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Detailed Analytics
              </Button>
            </Link>
          </div>
        }
      >
        {loading ? (
          <div className="space-y-3">
            <SkeletonLoader height="50px" className="rounded-xl" />
            <SkeletonLoader height="50px" className="rounded-xl" />
          </div>
        ) : !analytics?.eventPerformance || analytics.eventPerformance.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No Scheduled Events"
            description="You have not created any events yet. Create a new event to publish it to campus students."
            action={
              <Link to="/organizer/events/new">
                <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                  Create Event
                </Button>
              </Link>
            }
            className="py-10"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Event Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {analytics.eventPerformance.map((ev) => {
                  const evDate = ev.date
                    ? new Date(ev.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'Upcoming';

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
                      <td className="py-3.5 px-4 text-xs">
                        <span className="font-semibold text-white">{ev.registeredCount}</span>
                        <span className="text-slate-400"> / {ev.capacity} seats</span>
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
                          <Button variant="outline" size="sm">Attendance</Button>
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

export default OrganizerDashboard;
