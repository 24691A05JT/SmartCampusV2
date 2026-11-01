import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import StatCard from '../components/common/StatCard';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import SkeletonLoader from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';
import {
  Calendar,
  Users,
  Award,
  Sparkles,
  TrendingUp,
  Mail,
  Lock,
  Search,
  CheckCircle2,
  AlertTriangle,
  FolderSearch,
  UserCheck
} from 'lucide-react';

export const DemoFoundationPage = () => {
  const { success, error, warning, info } = useToast();
  const { user, role, setSession, logout } = useAuth();

  // Component State for Testing
  const [btnLoading, setBtnLoading] = useState(false);
  const [inputText, setInputText] = useState('Antigravity Campus');
  const [inputPassword, setInputPassword] = useState('SecretPass123!');
  const [inputError, setInputError] = useState('');
  const [selectedDept, setSelectedDept] = useState('CSE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [activeSkeleton, setActiveSkeleton] = useState('card');

  // Interactive mock login for testing role switching
  const handleMockRoleLogin = (testRole) => {
    const mockUser = {
      _id: 'mock_user_' + testRole,
      name: testRole === 'admin' ? 'Dr. Sarah Mitchell (Admin)' : testRole === 'organizer' ? 'Prof. David Vance (Faculty)' : 'Alex Rivera (Student)',
      email: `${testRole}@campus.edu`,
      role: testRole,
      department: 'Computer Science & Engineering',
      year: 3,
      semester: 6,
      interests: ['AI/ML', 'Hackathons', 'Cloud Architecture'],
      skills: ['React', 'Node.js', 'Python']
    };
    const mockToken = 'mock_jwt_token_' + testRole;
    setSession(mockToken, mockUser);
    success(`Switched active session to [${testRole.toUpperCase()}] role!`);
  };

  const handleConfirmAction = () => {
    setIsConfirming(true);
    setTimeout(() => {
      setIsConfirming(false);
      setIsConfirmOpen(false);
      success('Confirmed action successfully processed!');
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto">
        <Badge variant="primary" size="md" hasDot className="mb-4">
          Phase 2 Foundation Verification
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          Design System & Component Catalog
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Interactive verification playground for all Phase 2 reusable components, validation states, dark glassmorphism styling, and authentication flows.
        </p>
      </div>

      {/* Role Switcher & Auth State Tester */}
      <Card
        title="Interactive Session & Role Simulation Guard"
        subtitle="Test role-based permissions and simulated user context"
        headerAction={
          user ? (
            <Button variant="danger" size="sm" onClick={logout}>
              Sign Out
            </Button>
          ) : null
        }
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Active Session Status</p>
            <p className="text-sm font-bold text-white mt-1">
              {user ? `${user.name} (${user.email})` : 'Anonymous / Guest'}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-slate-400">Current Role:</span>
              <Badge variant={role === 'admin' ? 'danger' : role === 'organizer' ? 'warning' : 'primary'} size="sm" hasDot>
                {role || 'None'}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={role === 'student' ? 'primary' : 'outline'}
              onClick={() => handleMockRoleLogin('student')}
              leftIcon={<UserCheck className="w-4 h-4" />}
            >
              Simulate Student
            </Button>
            <Button
              size="sm"
              variant={role === 'organizer' ? 'primary' : 'outline'}
              onClick={() => handleMockRoleLogin('organizer')}
              leftIcon={<Users className="w-4 h-4" />}
            >
              Simulate Faculty/Organizer
            </Button>
            <Button
              size="sm"
              variant={role === 'admin' ? 'primary' : 'outline'}
              onClick={() => handleMockRoleLogin('admin')}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Simulate Admin
            </Button>
          </div>
        </div>
      </Card>

      {/* 1. Buttons */}
      <Card title="1. Button Component Variants & States" subtitle="Supports primary, secondary, outline, danger, ghost, glass, and loading states">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="glass">Glassmorphism</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" variant="primary">Small (sm)</Button>
            <Button size="md" variant="primary">Medium (md)</Button>
            <Button size="lg" variant="primary">Large (lg)</Button>
            <Button
              variant="primary"
              isLoading={btnLoading}
              onClick={() => {
                setBtnLoading(true);
                setTimeout(() => setBtnLoading(false), 2000);
              }}
            >
              {btnLoading ? 'Processing...' : 'Click to Test Loading Spinner'}
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. Inputs & Selects with Password Eye Toggle */}
      <Card title="2. Inputs, Selects & Eye Toggle" subtitle="Full keyboard navigation, password visibility toggle, error handling">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Input
            label="Full Name"
            placeholder="e.g. Alex Rivera"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            leftIcon={<Users className="w-4 h-4" />}
            helperText="Enter your official student records name"
            required
          />

          <Input
            label="Password with Eye Toggle"
            type="password"
            placeholder="Enter secure password"
            value={inputPassword}
            onChange={(e) => setInputPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            helperText="Click the eye icon on the right to toggle visibility"
            required
          />

          <Input
            label="Validation Error State"
            placeholder="Invalid input test"
            value={inputError}
            onChange={(e) => setInputError(e.target.value)}
            error={inputError.length === 0 ? 'This field cannot be left blank' : null}
            helperText="Type anything to clear the error state"
          />

          <Select
            label="Department"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            options={[
              { value: 'CSE', label: 'Computer Science & Engineering' },
              { value: 'ECE', label: 'Electronics & Communication' },
              { value: 'MECH', label: 'Mechanical Engineering' },
              { value: 'MBA', label: 'School of Business & Management' }
            ]}
            helperText="Selected department informs AI recommendation scoring"
          />

          <Select
            label="Academic Year"
            defaultValue="3"
            options={['1st Year', '2nd Year', '3rd Year', '4th Year']}
            helperText="Used to filter eligibility for campus workshops"
          />

          <Input
            label="Disabled Input"
            value="Read-only administrative setting"
            disabled
            leftIcon={<Mail className="w-4 h-4" />}
          />
        </div>
      </Card>

      {/* 3. Badges */}
      <Card title="3. Status Badge System" subtitle="Color-coded for roles, event categories, and workflow states">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="primary" hasDot>Primary / Student</Badge>
          <Badge variant="success" hasDot>Approved / Present</Badge>
          <Badge variant="warning" hasDot>Pending / Waitlist</Badge>
          <Badge variant="danger" hasDot>Rejected / Absent</Badge>
          <Badge variant="info" hasDot>Info / Seminar</Badge>
          <Badge variant="purple" hasDot>Technical Workshop</Badge>
          <Badge variant="neutral">Neutral Tag</Badge>
        </div>
      </Card>

      {/* 4. StatCards */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">4. Stat Cards & Metric Telemetry</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Registrations"
            value="1,482"
            icon={Calendar}
            trend="+18.4%"
            trendLabel="vs last month"
            accentColor="indigo"
          />
          <StatCard
            title="Attendance Rate"
            value="92.6%"
            icon={CheckCircle2}
            trend="+4.2%"
            trendLabel="attendance conversion"
            accentColor="emerald"
          />
          <StatCard
            title="Pending Approvals"
            value="14"
            icon={AlertTriangle}
            trend="-2.1%"
            trendLabel="faster turnaround"
            isPositive={true}
            accentColor="amber"
          />
          <StatCard
            title="Certificates Issued"
            value="890"
            icon={Award}
            trend="+24.5%"
            trendLabel="verifiable PDF credentials"
            accentColor="rose"
          />
        </div>
      </div>

      {/* 5. Toasts */}
      <Card title="5. Global Toast Notification System" subtitle="Accessible alerts with auto-dismiss and color status">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
            onClick={() => success('Event registration confirmed! Ticket code: TKT-2026-X89', 'Registration Success')}
          >
            Trigger Success Toast
          </Button>

          <Button
            variant="outline"
            className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
            onClick={() => error('Venue conflict detected: Auditorium A is already booked from 10:00 to 12:00', 'Schedule Overlap')}
          >
            Trigger Error Toast
          </Button>

          <Button
            variant="outline"
            className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
            onClick={() => warning('Registration deadline closes in 2 hours for AI Hackathon', 'Deadline Alert')}
          >
            Trigger Warning Toast
          </Button>

          <Button
            variant="outline"
            className="text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10"
            onClick={() => info('New recommended workshop matches your CSE interests', 'AI Recommendation')}
          >
            Trigger Info Toast
          </Button>
        </div>
      </Card>

      {/* 6. Modals & Dialogs */}
      <Card title="6. Modal & Confirm Dialog" subtitle="Backdrop blur, focus handling, keyboard ESC dismissal">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Open Standard Modal
          </Button>
          <Button variant="danger" onClick={() => setIsConfirmOpen(true)}>
            Open Dangerous Action Dialog
          </Button>
        </div>

        {/* Standard Modal Demo */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Campus Facility Booking Preview"
          description="Verify schedule details before submitting for administrative approval"
          footer={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsModalOpen(false);
                  success('Facility reservation submitted successfully!');
                }}
              >
                Confirm Booking
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-sm text-slate-300">
            <p>
              Auditorium A has been selected for <strong className="text-white">Annual Hackathon 2026</strong>. The automated conflict detection algorithm confirmed zero schedule overlaps during this timeframe.
            </p>
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span className="text-white font-medium">November 15, 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timings:</span>
                <span className="text-white font-medium">09:00 AM – 05:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Capacity:</span>
                <span className="text-white font-medium">350 Attendees</span>
              </div>
            </div>
          </div>
        </Modal>

        {/* Confirm Dialog Demo */}
        <ConfirmDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleConfirmAction}
          isConfirming={isConfirming}
          title="Revoke Certificate Credential?"
          message="Are you sure you want to revoke Certificate ID CERT-2026-A91B? The verification link will become permanently invalid."
          confirmText="Yes, Revoke Certificate"
          cancelText="Cancel"
          confirmVariant="danger"
        />
      </Card>

      {/* 7. Skeleton Loaders */}
      <Card
        title="7. Skeleton Loading State Placeholders"
        subtitle="Eliminates layout shifts during asynchronous data fetches"
        headerAction={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={activeSkeleton === 'card' ? 'primary' : 'outline'}
              onClick={() => setActiveSkeleton('card')}
            >
              Cards
            </Button>
            <Button
              size="sm"
              variant={activeSkeleton === 'stat' ? 'primary' : 'outline'}
              onClick={() => setActiveSkeleton('stat')}
            >
              Stats
            </Button>
            <Button
              size="sm"
              variant={activeSkeleton === 'table' ? 'primary' : 'outline'}
              onClick={() => setActiveSkeleton('table')}
            >
              Table
            </Button>
          </div>
        }
      >
        <SkeletonLoader variant={activeSkeleton} count={3} />
      </Card>

      {/* 8. Empty States */}
      <Card title="8. Empty State Presentations" subtitle="Provides helpful feedback and actionable guidance when queries return zero records">
        <EmptyState
          icon={FolderSearch}
          title="No Matching Events Found"
          description="We couldn't find any campus events matching your department and category filter. Try clearing your filters or search keywords."
          actionText="Clear All Filters"
          onAction={() => success('Filters cleared!')}
          secondaryActionText="Browse All Events"
          onSecondaryAction={() => info('Navigating to full catalog...')}
        />
      </Card>
    </div>
  );
};

export default DemoFoundationPage;
