import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';
import apiClient from '../services/apiClient';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import PasswordStrengthIndicator from '../components/auth/PasswordStrengthIndicator';

export const ResetPasswordPage = () => {
  const { token: urlToken } = useParams();
  const [tokenInput, setTokenInput] = useState(urlToken || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const effectiveToken = urlToken || tokenInput;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!effectiveToken) {
      setErrorMessage('Please provide a valid password reset token.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both password entries.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post(`/auth/reset-password/${effectiveToken}`, {
        password,
        confirmPassword
      });

      setIsSuccess(true);
      success('Password successfully reset! You can now log in.');
    } catch (err) {
      const msg = err.message || 'Reset token is invalid, expired, or has already been used.';
      setErrorMessage(msg);
      toastError(msg, 'Password Reset Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-indigo-600/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 items-center justify-center text-indigo-400 mb-4 shadow-lg">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Reset Account Password
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Establish a new high-security password for your campus portal account
          </p>
        </div>

        <Card className="border-slate-800 shadow-2xl">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p>{errorMessage}</p>
                    <Link
                      to="/forgot-password"
                      className="text-indigo-400 hover:underline mt-1 block font-semibold"
                    >
                      Request a new reset token →
                    </Link>
                  </div>
                </div>
              )}

              {/* If no token in URL, allow user to input token directly */}
              {!urlToken && (
                <Input
                  label="Password Reset Token"
                  placeholder="Paste 40-character reset token"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  leftIcon={<KeyRound className="w-4 h-4" />}
                  required
                />
              )}

              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

              {password && <PasswordStrengthIndicator password={password} />}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                fullWidth
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Reset Password & Protect Account
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h3 className="text-lg font-bold text-white">Password Updated Successfully</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your password has been securely updated. The reset token has been invalidated to prevent reuse.
              </p>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => navigate('/login')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Proceed to Sign In
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
            <Link to="/login" className="hover:text-white transition-colors">
              Return to Login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
