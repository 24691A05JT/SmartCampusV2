import { useAuth } from '../context/AuthContext';
import {
  Users,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Award,
  ShieldAlert,
  BarChart3,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const { user } = useAuth();

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
              Review Submissions (4)
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
          value="2,410"
          icon={Users}
          trend="+14% this month"
          accentColor="indigo"
        />
        <StatCard
          title="Campus Faculty Organizers"
          value="68"
          icon={ShieldCheck}
          trend="Across 8 Departments"
          accentColor="sky"
        />
        <StatCard
          title="Pending Approvals"
          value="4"
          icon={AlertTriangle}
          trend="Requires compliance check"
          accentColor="amber"
        />
        <StatCard
          title="Verifiable Certificates Issued"
          value="1,240"
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
          <Link to="/admin/events">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View Queue
            </Button>
          </Link>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="warning" size="sm" hasDot>Pending Review</Badge>
                <span className="text-xs text-slate-400">Auditorium A • Nov 25, 2026</span>
              </div>
              <h4 className="text-base font-bold text-white">Annual Inter-University Hackathon 2026</h4>
              <p className="text-xs text-slate-400 mt-1">
                Submitted by: Prof. K. Raman (CSE Department) • Target: All Departments • Capacity: 300
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Inspect Schedule
              </Button>
              <Button variant="primary" size="sm">
                Approve
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
