import { Check, X } from 'lucide-react';

export const PasswordStrengthIndicator = ({ password = '' }) => {
  const criteria = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'At least one uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'At least one lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'At least one number', valid: /\d/.test(password) },
    { label: 'At least one special character (!@#$%^&*)', valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
  ];

  const score = criteria.filter((c) => c.valid).length;

  const getStrengthLabel = () => {
    if (!password) return { label: 'Enter a strong password', color: 'text-slate-500', barColor: 'bg-slate-700' };
    if (score <= 2) return { label: 'Weak', color: 'text-rose-400', barColor: 'bg-rose-500' };
    if (score <= 3) return { label: 'Fair', color: 'text-amber-400', barColor: 'bg-amber-500' };
    if (score === 4) return { label: 'Good', color: 'text-sky-400', barColor: 'bg-sky-500' };
    return { label: 'Strong & Presentation-Ready', color: 'text-emerald-400', barColor: 'bg-emerald-500' };
  };

  const strength = getStrengthLabel();

  return (
    <div className="w-full space-y-2.5 pt-1">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Password Strength:</span>
          <span className={`font-semibold ${strength.color}`}>{strength.label}</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 h-1.5">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`h-full rounded-full transition-all duration-300 ${
                score >= step ? strength.barColor : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] pt-1">
        {criteria.map((c, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 transition-colors ${
              c.valid ? 'text-emerald-400 font-medium' : 'text-slate-500'
            }`}
          >
            {c.valid ? (
              <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            ) : (
              <X className="w-3.5 h-3.5 shrink-0 text-slate-600" />
            )}
            <span>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
