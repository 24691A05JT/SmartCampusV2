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
  MapPin,
  Activity,
  Ticket
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
  const [dashboardData, setDashboardData] = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchAdminDashboard = async () => {
      try {
        setLoading(true);
        const [adminRes, pendingRes] = await Promise.allSettled([
          apiClient.get('/admin/dashboard'),
          apiClient.get('/events', { params: { status: 'pending', limit: 3 } })
        ]);

        if (isMounted) {
          if (adminRes.status === 'fulfilled' && adminRes.value?.success) {
            setDashboardData(adminRes.value.data);
          }
          if (pendingRes.status === 'fulfilled') {
            const list = Array.isArray(pendingRes.value)
              ? pendingRes.value
              : pendingRes.value?.data?.events || pendingRes.value?.events || [];
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

  const summary = dashboardData?.summary || {
    totalStudents: 0,
    totalOrganizers: 0,
    pendingEvents: 0,
    totalCertificatesIssued: 0,
    suspendedUsers: 0,
    totalAuditLogs: 0
  };

  const recentLogs = dashboardData?.recentLogs || [];

  const getActionVariant = (action = '') => {
    if (action.includes('DEACTIVATED') || action.includes('REVOKED') || action.includes('CANCELLED')) {
      return 'danger';
    }
    if (action.includes('APPROVED') || action.includes('REACTIVATED') || action.includes('ISSUED')) {
      return 'success';
    }
    if (action.includes('REJECTED') || action.includes('UPDATE') || action.includes('WARNING')) {
      return 'warning';
    }
    return 'primary';
  };

  const formatLogDate = (dateStr) => {
    if (!dateStr) return 'Recent';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/admin/events">
            <Button variant="primary" size="sm" leftIcon={<CheckCircle className="w-4 h-4" />}>
              Review Submissions ({loading ? '...' : summary.pendingEvents})
            </Button>
          </Link>
          <Link to="/admin/users">
            <Button variant="outline" size="sm" leftIcon={<Users className="w-4 h-4" />}>
              User Governance
            </Button>
          </Link>
          <Link to="/admin/registrations">
            <Button variant="outline" size="sm" leftIcon={<Ticket className="w-4 h-4" />}>
              Registrations
            </Button>
          </Link>
          <Link to="/admin/audit-logs">
            <Button variant="outline" size="sm" leftIcon={<ShieldAlert className="w-4 h-4" />}>
              Audit Trail
            </Button>
          </Link>
          <Link to="/admin/analytics">
            <Button variant="glass" size="sm" leftIcon={<BarChart3 className="w-4 h-4" />}>
              Analytics
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
          trend={summary.pendingEvents > 0 ? 'Requires moderation' : 'Queue clear'}
          accentColor="amber"
        />
        <StatCard
          title="Audit Trail Events"
          value={loading ? '...' : String(summary.totalAuditLogs)}
          icon={Activity}
          trend={`${summary.suspendedUsers} suspended accounts`}
          accentColor="emerald"
        />
      </div>

      {/* Two-Column Grid: Pending Approvals & Live Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Submissions */}
        <Card
          title="Pending Event Approvals"
          subtitle="Proposals awaiting administrative compliance check"
          headerAction={
            <Link to="/admin/events">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                View Queue
              </Button>
            </Link>
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
              title="All Submissions Clear"
              description="No pending events require moderation at this time."
              action={
                <Link to="/admin/events">
                  <Button variant="outline" size="sm">
                    View Event Catalog
                  </Button>
                </Link>
              }
              className="py-8"
            />
          ) : (
            <div className="space-y-3">
              {pendingEvents.map((ev) => {
                const evDate = ev.date
                  ? new Date(ev.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'Upcoming';

                return (
                  <div
                    key={ev._id}
                    className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant="warning" size="sm" hasDot>Pending</Badge>
                        <span className="text-xs text-slate-400 truncate">{ev.venue} • {evDate}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white truncate">{ev.title}</h4>
                      <p className="text-xs text-slate-500">
                        {ev.organizer?.name || 'Faculty Member'}
                      </p>
                    </div>

                    <Link to="/admin/events" className="shrink-0">
                      <Button variant="primary" size="sm">
                        Review
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Live Governance Audit Stream */}
        <Card
          title="Recent Governance Audit Activity"
          subtitle="Real-time chronological log of administrative interventions"
          headerAction={
            <Link to="/admin/audit-logs">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Full Audit Trail
              </Button>
            </Link>
          }
        >
          {loading ? (
            <div className="space-y-3">
              <SkeletonLoader height="70px" className="rounded-xl" />
              <SkeletonLoader height="70px" className="rounded-xl" />
            </div>
          ) : recentLogs.length === 0 ? (
            <EmptyState
              icon={ShieldAlert}
              title="No Audit Records"
              description="No recent administrative actions recorded."
              className="py-8"
            />
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log._id}
                  className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant={getActionVariant(log.action)} size="sm">
                        {log.action}
                      </Badge>
                      <span className="text-xs text-slate-500">{formatLogDate(log.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      By <strong className="text-white">{log.performedBy?.name || 'Admin'}</strong> on{' '}
                      <span className="text-indigo-300">{log.targetType || 'System'}</span>
                    </p>
                  </div>

                  <Link to="/admin/audit-logs" className="shrink-0">
                    <Button variant="ghost" size="sm">
                      Inspect
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
