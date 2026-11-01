import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Sparkles, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const { login, isAuthenticated, role } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Load remembered email on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('smartcampus_remembered_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch (e) {
      console.warn('Unable to read remembered email', e);
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        const dest = role === 'admin' ? '/admin' : role === 'organizer' ? '/organizer' : '/student';
        navigate(dest, { replace: true });
      }
    }
  }, [isAuthenticated, role, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email || !password) {
      setFormError('Please enter both your institutional email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await login({ email, password });
      
      // Save or remove remembered email
      if (rememberMe) {
        localStorage.setItem('smartcampus_remembered_email', email);
      } else {
        localStorage.removeItem('smartcampus_remembered_email');
      }

      success(`Welcome back, ${response.data.user.name}!`);
      
      const userRole = response.data.user.role;
      const target = location.state?.from?.pathname || (userRole === 'admin' ? '/admin' : userRole === 'organizer' ? '/organizer' : '/student');
      navigate(target, { replace: true });
    } catch (err) {
      const msg = err.message || 'Invalid email or password. Please try again.';
      setFormError(msg);
      toastError(msg, 'Authentication Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
      {/* Background Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[450px] bg-indigo-600/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-md w-full relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 items-center justify-center text-white shadow-xl shadow-indigo-600/25 mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sign In to Smart Campus
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Access your student portal, faculty events, or administration workspace
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium">
                {formError}
              </div>
            )}

            <Input
              label="Campus Email Address"
              type="email"
              placeholder="e.g. yourname@campus.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />

            <div className="space-y-1">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                autoComplete="current-password"
                required
              />
              <div className="flex justify-end pt-1">
                <Link
                  to="/forgot-password"
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-xs text-slate-300 cursor-pointer select-none">
                Remember my email on this device
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              fullWidth
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Workspace
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
            <span>Don't have a campus account? </span>
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Create an account
            </Link>
          </div>
        </Card>

        {/* Security Assurance Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Role-Based Access Control • 256-bit JWT Encryption</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
