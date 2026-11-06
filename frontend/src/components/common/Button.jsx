import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500/30 focus-visible:ring-indigo-500',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 focus-visible:ring-slate-500',
  outline: 'bg-transparent hover:bg-white/5 text-slate-200 border border-slate-700 hover:border-slate-500 focus-visible:ring-indigo-500',
  danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25 border border-rose-500/30 focus-visible:ring-rose-500',
  ghost: 'bg-transparent hover:bg-white/10 text-slate-300 hover:text-white focus-visible:ring-slate-500',
  glass: 'bg-white/10 hover:bg-white/15 text-white backdrop-blur-md border border-white/15 focus-visible:ring-indigo-500'
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2 font-medium',
  lg: 'px-6 py-3.5 text-base rounded-xl gap-2.5 font-semibold'
};

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  loadingText,
  disabled = false,
  fullWidth = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  onClick,
  ...props
}) => {
  const variantClasses = VARIANTS[variant] || VARIANTS.primary;
  const sizeClasses = SIZES[size] || SIZES.md;
  const isBusy = Boolean(isLoading || loading);
  const isButtonDisabled = Boolean(disabled || isBusy);

  return (
    <button
      type={type}
      disabled={isButtonDisabled}
      aria-busy={isBusy ? 'true' : undefined}
      aria-disabled={isButtonDisabled ? 'true' : undefined}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-[0.98] ${
        fullWidth ? 'w-full' : ''
      } ${
        isButtonDisabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
      } ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {isBusy ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" aria-hidden="true" />
          <span>{loadingText || children || 'Loading...'}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
