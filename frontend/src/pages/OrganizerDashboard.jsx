import { useAuth } from '../context/AuthContext';
import { Calendar, Users, ClipboardCheck, PlusCircle, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { Link } from 'react-router-dom';

export const OrganizerDashboard = () => {
  const { user } = useAuth();

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
          value="12"
          icon={Calendar}
          trend="+3 this semester"
          accentColor="indigo"
        />
        <StatCard
          title="Total Registrations"
          value="840"
          icon={Users}
          trend="88% capacity utilization"
          accentColor="emerald"
        />
        <StatCard
          title="Pending Approvals"
          value="2"
          icon={AlertCircle}
          trend="Awaiting admin review"
          accentColor="amber"
        />
        <StatCard
          title="Avg Event Rating"
          value="4.8 ★"
          icon={TrendingUp}
          trend="From 420 reviews"
          accentColor="rose"
        />
      </div>

      {/* Active Events Table / List */}
      <Card
        title="Your Scheduled Campus Events"
        subtitle="Manage registrations, check capacity, and mark student attendance"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Event Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Schedule</th>
                <th className="py-3 px-4">Venue</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-white">
                  Next-Gen Cybersecurity & Ethical Hacking
                </td>
                <td className="py-3.5 px-4">
                  <Badge variant="purple" size="sm">Technical</Badge>
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-300">
                  Nov 14, 2026 • 10:00 AM
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-300">Lab 402</td>
                <td className="py-3.5 px-4 text-xs">
                  <span className="font-semibold text-white">48</span> / 50 seats
                </td>
                <td className="py-3.5 px-4">
                  <Badge variant="success" size="sm" hasDot>Approved</Badge>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <Link to="/organizer/attendance">
                    <Button variant="outline" size="sm">Attendance</Button>
                  </Link>
                </td>
              </tr>

              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-white">
                  Advanced Robotics & IoT System Design
                </td>
                <td className="py-3.5 px-4">
                  <Badge variant="info" size="sm">Workshop</Badge>
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-300">
                  Nov 20, 2026 • 02:00 PM
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-300">Auditorium B</td>
                <td className="py-3.5 px-4 text-xs">
                  <span className="font-semibold text-white">120</span> / 150 seats
                </td>
                <td className="py-3.5 px-4">
                  <Badge variant="warning" size="sm" hasDot>Pending</Badge>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <Button variant="ghost" size="sm">Edit Details</Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default OrganizerDashboard;
