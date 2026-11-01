import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import apiClient from '../services/apiClient';
import {
  User,
  Mail,
  Building,
  GraduationCap,
  KeyRound,
  Save,
  CheckCircle2,
  Lock,
  Tag,
  Shield
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import SkeletonLoader from '../components/common/SkeletonLoader';
import PasswordStrengthIndicator from '../components/auth/PasswordStrengthIndicator';

const ALL_INTERESTS = [
  'Web Development',
  'AI/ML',
  'Cloud Architecture',
  'Cybersecurity',
  'Robotics & IoT',
  'UI/UX Design',
  'Competitive Coding',
  'Cultural & Arts',
  'Entrepreneurship'
];

export const ProfilePage = () => {
  const { user: authUser, role, updateUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [profileLoading, setProfileLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Profile Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [year, setYear] = useState(1);
  const [semester, setSemester] = useState(1);
  const [interests, setInterests] = useState([]);
  const [skills, setSkills] = useState([]);
  const [customSkill, setCustomSkill] = useState('');

  // Password Change Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');

  // Fetch real profile data from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        const res = await apiClient.get('/users/profile');
        const data = res.data;
        setName(data.name || '');
        setEmail(data.email || '');
        setDepartment(data.department || 'Computer Science & Engineering');
        setYear(data.year || 1);
        setSemester(data.semester || 1);
        setInterests(data.interests || []);
        setSkills(data.skills || []);
      } catch (err) {
        // Fallback to local session data
        if (authUser) {
          setName(authUser.name || '');
          setEmail(authUser.email || '');
          setDepartment(authUser.department || '');
          setYear(authUser.year || 1);
          setSemester(authUser.semester || 1);
          setInterests(authUser.interests || []);
          setSkills(authUser.skills || []);
        }
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [authUser]);

  const toggleInterest = (interest) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const addSkill = (e) => {
    e.preventDefault();
    if (customSkill.trim() && !skills.includes(customSkill.trim())) {
      setSkills((prev) => [...prev, customSkill.trim()]);
      setCustomSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await apiClient.put('/users/profile', {
        name,
        department,
        year: Number(year),
        semester: Number(semester),
        interests,
        skills
      });

      updateUser(response.data);
      success('Profile updated successfully!');
    } catch (err) {
      toastError(err.message || 'Failed to update profile.', 'Update Error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassError('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPassError('New password must be at least 8 characters long.');
      return;
    }

    setIsChangingPass(true);
    try {
      await apiClient.put('/users/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      });

      success('Password changed successfully! Next time you sign in, use your new password.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.message || 'Failed to update password. Verify current password.';
      setPassError(msg);
      toastError(msg, 'Password Change Failed');
    } finally {
      setIsChangingPass(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <SkeletonLoader variant="stat" count={1} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonLoader variant="card" count={1} />
          <SkeletonLoader variant="card" count={1} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Identity Card */}
      <div className="p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-indigo-600/25 shrink-0">
            {name ? name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-tight">{name}</h2>
              <Badge
                variant={role === 'admin' ? 'danger' : role === 'organizer' ? 'warning' : 'primary'}
                size="sm"
                hasDot
              >
                {role || 'Student'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {email}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                {department}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal & Academic Details Form */}
        <Card
          title="Profile Information"
          subtitle="Update your student profile and recommendation preferences"
        >
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="Institutional Email"
              value={email}
              disabled
              leftIcon={<Mail className="w-4 h-4" />}
              helperText="Institutional email is verified and cannot be changed"
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
              required
            />

            {role === 'student' && (
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Academic Year"
                  value={year.toString()}
                  onChange={(e) => setYear(Number(e.target.value))}
                  options={[
                    { value: '1', label: '1st Year' },
                    { value: '2', label: '2nd Year' },
                    { value: '3', label: '3rd Year' },
                    { value: '4', label: '4th Year' }
                  ]}
                />

                <Select
                  label="Semester"
                  value={semester.toString()}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  options={[
                    { value: '1', label: 'Sem 1' },
                    { value: '2', label: 'Sem 2' },
                    { value: '3', label: 'Sem 3' },
                    { value: '4', label: 'Sem 4' },
                    { value: '5', label: 'Sem 5' },
                    { value: '6', label: 'Sem 6' },
                    { value: '7', label: 'Sem 7' },
                    { value: '8', label: 'Sem 8' }
                  ]}
                />
              </div>
            )}

            {/* Interest Tags */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Interests (AI Scoring Alignment)
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-950/40 rounded-xl border border-slate-800">
                {ALL_INTERESTS.map((item) => {
                  const isSelected = interests.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleInterest(item)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Skills & Technical Competencies
              </label>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="hover:text-rose-400 ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add skill (e.g. AWS)..."
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 flex-1"
                />
                <Button size="sm" variant="outline" onClick={addSkill}>
                  Add
                </Button>
              </div>
            </div>

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

        {/* Change Password Card */}
        <Card
          title="Security & Password"
          subtitle="Update account password with bcrypt validation"
        >
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium">
                {passError}
              </div>
            )}

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
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            {newPassword && <PasswordStrengthIndicator password={newPassword} />}

            <Button
              type="submit"
              variant="outline"
              size="md"
              isLoading={isChangingPass}
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
