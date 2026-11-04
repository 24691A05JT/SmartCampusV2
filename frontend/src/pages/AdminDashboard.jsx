import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import {
  Users,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Award,
  ShieldAlert,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  Clock,
  MapPin
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import SkeletonLoader from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchAdminDashboard = async () => {
      try {
        setLoading(true);
        const [analyticsRes, pendingRes] = await Promise.allSettled([
          apiClient.get('/analytics/admin'),
          apiClient.get('/events', { params: { status: 'pending', limit: 3 } })
        ]);

        if (isMounted) {
          if (analyticsRes.status === 'fulfilled') {
            setAnalytics(analyticsRes.value.data);
          }
          if (pendingRes.status === 'fulfilled') {
            const list = Array.isArray(pendingRes.value.data)
              ? pendingRes.value.data
              : pendingRes.value.data?.events || [];
            setPendingEvents(list);
          }
        }
      } catch (err) {
        console.warn('Could not load admin dashboard metrics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAdminDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = analytics?.summary || {
    totalStudents: 0,
    totalOrganizers: 0,
    pendingEvents: 0,
    totalCertificatesIssued: 0
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl">
        <div>
          <Badge variant="danger" size="sm" hasDot className="mb-2">
            Administrator Command Center
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Campus Executive Governance
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Logged in as: <span className="text-white font-medium">{user?.name}</span> • System Administrator
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/events">
            <Button variant="primary" size="md" leftIcon={<CheckCircle className="w-4 h-4" />}>
              Review Submissions ({loading ? '...' : summary.pendingEvents})
            </Button>
          </Link>
          <Link to="/admin/analytics">
            <Button variant="glass" size="md" leftIcon={<BarChart3 className="w-4 h-4" />}>
              Campus Analytics
            </Button>
          </Link>
          <Link to="/admin/users">
            <Button variant="outline" size="md" leftIcon={<Users className="w-4 h-4" />}>
              User Governance
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Registered Students"
          value={loading ? '...' : String(summary.totalStudents)}
          icon={Users}
          trend={`${summary.totalStudents > 0 ? summary.totalStudents : 0} enrolled accounts`}
          accentColor="indigo"
        />
        <StatCard
          title="Campus Faculty Organizers"
          value={loading ? '...' : String(summary.totalOrganizers)}
          icon={ShieldCheck}
          trend="Authorized event hosts"
          accentColor="sky"
        />
        <StatCard
          title="Pending Approvals"
          value={loading ? '...' : String(summary.pendingEvents)}
          icon={AlertTriangle}
          trend={summary.pendingEvents > 0 ? 'Requires compliance check' : 'Queue clear'}
          accentColor="amber"
        />
        <StatCard
          title="Verifiable Certificates Issued"
          value={loading ? '...' : String(summary.totalCertificatesIssued)}
          icon={Award}
          trend="Cryptographically signed"
          accentColor="emerald"
        />
      </div>

      {/* Submissions Requiring Immediate Review */}
      <Card
        title="Pending Event Approval Submissions"
        subtitle="Review event details, venue allocation, and conflict checks before granting approval"
        headerAction={
          <div className="flex items-center gap-3">
            <Link to="/admin/analytics">
              <Button variant="ghost" size="sm" rightIcon={<BarChart3 className="w-4 h-4" />}>
                Analytics Deep Dive
              </Button>
            </Link>
            <Link to="/admin/events">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                View Queue
              </Button>
            </Link>
          </div>
        }
      >
        {loading ? (
          <div className="space-y-3">
            <SkeletonLoader height="70px" className="rounded-xl" />
            <SkeletonLoader height="70px" className="rounded-xl" />
          </div>
        ) : pendingEvents.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="All Event Submissions Reviewed"
            description="There are no pending events requiring administrative moderation at this time."
            action={
              <Link to="/admin/events">
                <Button variant="outline" size="sm">
                  View Full Event Catalog
                </Button>
              </Link>
            }
            className="py-10"
          />
        ) : (
          <div className="space-y-4">
            {pendingEvents.map((ev) => {
              const evDate = ev.date
                ? new Date(ev.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                : 'Upcoming';

              return (
                <div
                  key={ev._id}
                  className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="warning" size="sm" hasDot>Pending Review</Badge>
                      <span className="text-xs text-slate-400">{ev.venue} • {evDate}</span>
                    </div>
                    <h4 className="text-base font-bold text-white">{ev.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Submitted by: {ev.organizer?.name || 'Faculty Member'} ({ev.organizer?.department || 'Department'}) • Capacity: {ev.capacity}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link to="/admin/events">
                      <Button variant="primary" size="sm">
                        Review in Queue
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
  );
};

export default AdminDashboard;
