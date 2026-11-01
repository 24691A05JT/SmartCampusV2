import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, KeyRound, CheckCircle2 } from 'lucide-react';
import apiClient from '../services/apiClient';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState(null);

  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      setSubmitted(true);
      success('Password reset instructions generated.');
      
      // If server returned resetToken (dev/test mode)
      if (response.data?.resetToken) {
        setResetToken(response.data.resetToken);
      }
    } catch (err) {
      toastError(err.message || 'Unable to process reset request.', 'Request Failed');
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
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Forgot Password?
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Enter your campus email to receive a secure, cryptographically verified reset token
          </p>
        </div>

        <Card className="border-slate-800 shadow-2xl">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Institutional Email"
                type="email"
                placeholder="e.g. student@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                fullWidth
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Send Reset Instructions
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Reset Instructions Dispatched</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                If an account exists for <strong className="text-white">{email}</strong>, a secure reset token expiring in 15 minutes has been generated.
              </p>

              {/* Dev/Evaluation Helper */}
              {resetToken && (
                <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl text-left space-y-2 mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300">
                    Evaluation Token (Test Mode)
                  </p>
                  <code className="text-xs bg-slate-950 p-2 rounded block break-all text-indigo-200">
                    {resetToken}
                  </code>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => navigate(`/reset-password/${resetToken}`)}
                  >
                    Proceed to Reset with Token
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
