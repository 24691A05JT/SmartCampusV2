import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Shield, Building, Award, KeyRound, Save } from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';

export const ProfilePage = () => {
  const { user, role, updateUser } = useAuth();
  const { success } = useToast();

  const [name, setName] = useState(user?.name || 'Alex Rivera');
  const [department, setDepartment] = useState(user?.department || 'Computer Science & Engineering');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      updateUser({ name, department });
      success('Profile details updated successfully!');
    }, 600);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    success('Password changed securely!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Profile Identity Card */}
      <div className="p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-indigo-600/25">
            {name ? name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-white tracking-tight">{name}</h2>
              <Badge variant={role === 'admin' ? 'danger' : role === 'organizer' ? 'warning' : 'primary'} size="sm" hasDot>
                {role || 'Student'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              <span>{user?.email || 'user@campus.edu'}</span>
              <span>•</span>
              <Building className="w-3.5 h-3.5" />
              <span>{department}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Details Form */}
        <Card title="Personal Information" subtitle="Update your campus student/faculty details">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="Email Address"
              value={user?.email || 'student@campus.edu'}
              disabled
              leftIcon={<Mail className="w-4 h-4" />}
              helperText="Institutional email is managed by university administrator"
            />

            <Select
              label="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              options={[
                'Computer Science & Engineering',
                'Electronics & Communication',
                'Mechanical Engineering',
                'Information Technology',
                'School of Business & Management'
              ]}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
              fullWidth
            >
              Save Profile Changes
            </Button>
          </form>
        </Card>

        {/* Change Password Form */}
        <Card title="Security & Password" subtitle="Ensure your account is protected with a strong password">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              leftIcon={<KeyRound className="w-4 h-4" />}
              required
            />

            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<KeyRound className="w-4 h-4" />}
              helperText="Minimum 8 characters with numbers and symbols"
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<KeyRound className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="outline"
              size="md"
              fullWidth
            >
              Update Password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
