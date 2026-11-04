import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import {
  Users,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Award,
  ShieldCheck,
  BarChart3,
  RefreshCw,
  Building2,
  MapPin,
  Star,
  Activity
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import SkeletonLoader from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';
import DepartmentBarChart from '../components/analytics/DepartmentBarChart';
import CategoryPieChart from '../components/analytics/CategoryPieChart';
import ParticipationTrendChart from '../components/analytics/ParticipationTrendChart';
import { Link } from 'react-router-dom';

export const AdminAnalyticsPage = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const res = await apiClient.get('/analytics/admin');
      setAnalytics(res.data);
    } catch (err) {
      console.warn('Failed to load admin institutional analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const summary = analytics?.summary || {
    totalUsers: 0,
    totalStudents: 0,
    totalOrganizers: 0,
    totalAdmins: 0,
    activeUsers: 0,
    totalEvents: 0,
    approvedEvents: 0,
    pendingEvents: 0,
    rejectedEvents: 0,
    draftEvents: 0,
    cancelledEvents: 0,
    totalApprovedCapacity: 0,
    totalRegistrations: 0,
    campusAttendanceRate: 0,
    totalPresent: 0,
    totalCertificatesIssued: 0,
    campusAverageRating: 0,
    totalReviews: 0
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl">
        <div>
          <Badge variant="danger" size="sm" hasDot className="mb-2">
            Institutional Command Intelligence
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Campus-Wide Engagement Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            University governance dashboard • Active monitor: <span className="text-white font-medium">{user?.name}</span>
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
            Refresh Data
          </Button>
          <Link to="/admin/events">
            <Button variant="primary" size="md" leftIcon={<CheckCircle className="w-4 h-4" />}>
              Review Submissions ({summary.pendingEvents})
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Campus Students"
          value={loading ? '...' : String(summary.totalStudents)}
          icon={Users}
          trend={`${summary.totalUsers} total registered accounts`}
          accentColor="indigo"
        />
        <StatCard
          title="Faculty Organizers"
          value={loading ? '...' : String(summary.totalOrganizers)}
          icon={ShieldCheck}
          trend={`${summary.approvedEvents} approved events conducted`}
          accentColor="sky"
        />
        <StatCard
          title="Campus Turnout Rate"
          value={loading ? '...' : `${summary.campusAttendanceRate}%`}
          icon={Activity}
          trend={`${summary.totalPresent} verified present attendances`}
          accentColor="emerald"
        />
        <StatCard
          title="Student Satisfaction"
          value={loading ? '...' : `${summary.campusAverageRating} ★`}
          icon={Star}
          trend={summary.totalReviews > 0 ? `Across ${summary.totalReviews} student reviews` : 'Awaiting feedback'}
          accentColor="amber"
        />
      </div>

      {/* Secondary Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400">Total Registrations</span>
          <p className="text-xl font-bold text-white mt-1">
            {loading ? '...' : summary.totalRegistrations}
          </p>
          <span className="text-[11px] text-indigo-400">Campus bookings</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400">Pending Approvals</span>
          <p className="text-xl font-bold text-white mt-1">
            {loading ? '...' : summary.pendingEvents}
          </p>
          <span className="text-[11px] text-amber-400">Requires review</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400">Valid Certificates</span>
          <p className="text-xl font-bold text-white mt-1">
            {loading ? '...' : summary.totalCertificatesIssued}
          </p>
          <span className="text-[11px] text-emerald-400">Cryptographically signed</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400">Total Event Capacity</span>
          <p className="text-xl font-bold text-white mt-1">
            {loading ? '...' : summary.totalApprovedCapacity}
          </p>
          <span className="text-[11px] text-sky-400">Allocated seats</span>
        </div>
      </div>

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Department Breakdown BarChart */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Department Enrollment & Event Participation"
            subtitle="Comparing student enrollment and event booking volume by academic department"
          >
            {loading ? (
              <SkeletonLoader height="280px" className="rounded-2xl" />
            ) : (
              <DepartmentBarChart
                data={analytics?.departmentDistribution || []}
                height={280}
              />
            )}
          </Card>
        </div>

        {/* Right Col: Campus Category Distribution */}
        <div className="space-y-6">
          <Card
            title="Campus Events by Category"
            subtitle="Breakdown of approved event types"
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

      {/* Lower Visualizations Grid: Monthly Velocity & Top Venues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Monthly Campus Velocity */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="6-Month Campus Throughput Velocity"
            subtitle="Monthly approved event count vs student registration volume"
          >
            {loading ? (
              <SkeletonLoader height="260px" className="rounded-2xl" />
            ) : (
              <ParticipationTrendChart
                data={analytics?.monthlyVelocity || []}
                series={[
                  { key: 'registrations', name: 'Registrations', color: '#6366f1' },
                  { key: 'events', name: 'Approved Events', color: '#10b981' }
                ]}
                height={260}
              />
            )}
          </Card>
        </div>

        {/* Right Col: Top Venue Utilization */}
        <div className="space-y-6">
          <Card
            title="Most Booked Campus Venues"
            subtitle="Top facility locations by approved events"
          >
            {loading ? (
              <div className="space-y-3">
                <SkeletonLoader height="40px" className="rounded-xl" />
                <SkeletonLoader height="40px" className="rounded-xl" />
                <SkeletonLoader height="40px" className="rounded-xl" />
              </div>
            ) : !analytics?.venueUtilization || analytics.venueUtilization.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="No Venue Data"
                description="Venue booking metrics will populate as events are approved."
                className="py-10"
              />
            ) : (
              <div className="space-y-2.5">
                {analytics.venueUtilization.map((v, idx) => (
                  <div
                    key={v.venue}
                    className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-medium text-white truncate max-w-[150px]">
                        {v.venue}
                      </span>
                    </div>
                    <Badge variant="neutral" size="sm">
                      {v.eventCount} {v.eventCount === 1 ? 'event' : 'events'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
