import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Sparkles,
  User,
  Mail,
  Lock,
  Building,
  GraduationCap,
  Calendar,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Tag,
  Plus
} from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import PasswordStrengthIndicator from '../components/auth/PasswordStrengthIndicator';

const PRESET_INTERESTS = [
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

const PRESET_SKILLS = [
  'JavaScript',
  'React',
  'Node.js',
  'Python',
  'Java',
  'SQL',
  'Docker',
  'Git',
  'Public Speaking',
  'Project Management'
];

export const RegisterPage = () => {
  const [role, setRole] = useState('student'); // 'student' or 'organizer'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [year, setYear] = useState('3');
  const [semester, setSemester] = useState('6');
  const [interests, setInterests] = useState(['AI/ML', 'Web Development']);
  const [skills, setSkills] = useState(['React', 'Node.js']);
  const [customSkill, setCustomSkill] = useState('');
  
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const toggleInterest = (interest) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const toggleSkill = (skill) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = (e) => {
    e.preventDefault();
    if (customSkill.trim() && !skills.includes(customSkill.trim())) {
      setSkills((prev) => [...prev, customSkill.trim()]);
      setCustomSkill('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name || !email || !password || !confirmPassword || !department) {
      setFormError('Please complete all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please verify both password entries.');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await register({
        name,
        email,
        password,
        confirmPassword,
        role,
        department,
        year: Number(year),
        semester: Number(semester),
        interests,
        skills
      });

      success('Account created successfully! Welcome to Smart Campus.');
      const dest = role === 'organizer' ? '/organizer' : '/student';
      navigate(dest, { replace: true });
    } catch (err) {
      const msg = err.message || 'Registration failed. Please check your details.';
      setFormError(msg);
      toastError(msg, 'Registration Error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-600/10 blur-[150px] pointer-events-none rounded-full" />

      <div className="max-w-2xl w-full mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 items-center justify-center text-white shadow-xl shadow-indigo-600/25 mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Create Campus Account
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Join the smart campus network for AI-powered events, recommendations, and verifiable credentials
          </p>
        </div>

        {/* Registration Card */}
        <Card className="border-slate-800 shadow-2xl">
          {/* Role Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950/70 rounded-2xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                role === 'student'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Registration</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('organizer')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                role === 'organizer'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Faculty / Organizer</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {formError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium">
                {formError}
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Full Name"
                placeholder="e.g. Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Institutional Email"
                type="email"
                placeholder="e.g. alex.rivera@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />
            </div>

            {/* Passwords with Eye Toggles & Strength Indicator */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            {/* Password Strength Indicator Component */}
            {password && <PasswordStrengthIndicator password={password} />}

            {/* Academic Classification */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="sm:col-span-1">
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
              </div>

              {role === 'student' && (
                <>
                  <div>
                    <Select
                      label="Academic Year"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      options={[
                        { value: '1', label: '1st Year' },
                        { value: '2', label: '2nd Year' },
                        { value: '3', label: '3rd Year' },
                        { value: '4', label: '4th Year' }
                      ]}
                    />
                  </div>

                  <div>
                    <Select
                      label="Current Semester"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      options={[
                        { value: '1', label: 'Semester 1' },
                        { value: '2', label: 'Semester 2' },
                        { value: '3', label: 'Semester 3' },
                        { value: '4', label: 'Semester 4' },
                        { value: '5', label: 'Semester 5' },
                        { value: '6', label: 'Semester 6' },
                        { value: '7', label: 'Semester 7' },
                        { value: '8', label: 'Semester 8' }
                      ]}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Interests Tag Selector (Used by AI Recommendation Engine) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Select Co-Curricular & Academic Interests
                </label>
                <span className="text-[11px] text-indigo-400 font-medium">
                  Powers AI Recommendation Scoring
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESET_INTERESTS.map((item) => {
                  const isSelected = interests.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleInterest(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
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

            {/* Skills Tags */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Skills & Technical Competencies
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_SKILLS.map((skill) => {
                  const isSelected = skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {skill}
                    </button>
                  );
                })}
              </div>

              {/* Add custom skill input */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add custom skill (e.g. GraphQL)..."
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500"
                />
                <Button size="sm" variant="outline" onClick={addCustomSkill}>
                  Add
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              fullWidth
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Complete {role === 'organizer' ? 'Faculty' : 'Student'} Registration
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
            <span>Already registered? </span>
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
