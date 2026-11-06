import { useState, useId, forwardRef } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export const Input = forwardRef(
  (
    {
      label,
      type = 'text',
      id,
      name,
      value,
      onChange,
      placeholder,
      error,
      helperText,
      disabled = false,
      required = false,
      leftIcon = null,
      rightIcon = null,
      className = '',
      autoComplete,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const reactId = useId();
    const isPasswordType = type === 'password';
    const computedType = isPasswordType ? (showPassword ? 'text' : 'password') : type;
    const inputId = id || name || `input-${reactId}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const ariaDescribedBy = error ? errorId : helperText ? helperId : undefined;

    return (
      <div className="flex flex-col gap-1.5 w-full text-left">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {label}
            {required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3.5 text-slate-400 pointer-events-none shrink-0" aria-hidden="true">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            type={computedType}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            required={required}
            autoComplete={autoComplete}
            aria-invalid={Boolean(error)}
            aria-describedby={ariaDescribedBy}
            aria-required={required ? 'true' : undefined}
            className={`w-full px-4 py-2.5 bg-slate-900/90 text-slate-100 placeholder-slate-500 text-sm rounded-xl border transition-all duration-200 outline-none ${
              leftIcon ? 'pl-10' : ''
            } ${
              isPasswordType || rightIcon ? 'pr-11' : ''
            } ${
              error
                ? 'border-rose-500/80 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                : 'border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
            } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-950' : ''} ${className}`}
            {...props}
          />

          {isPasswordType ? (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
            </button>
          ) : (
            rightIcon && (
              <span className="absolute right-3.5 text-slate-400 pointer-events-none shrink-0" aria-hidden="true">
                {rightIcon}
              </span>
            )
          )}
        </div>

        {error ? (
          <p id={errorId} role="alert" aria-live="polite" className="flex items-center gap-1.5 text-xs text-rose-400 font-medium mt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : (
          helperText && <p id={helperId} className="text-xs text-slate-400 mt-0.5">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
