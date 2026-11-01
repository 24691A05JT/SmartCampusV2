const VARIANTS = {
  primary: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  danger: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  info: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  neutral: 'bg-slate-800 text-slate-300 border-slate-700'
};

const DOT_COLORS = {
  primary: 'bg-indigo-400',
  success: 'bg-emerald-400 animate-pulse',
  warning: 'bg-amber-400',
  danger: 'bg-rose-400',
  info: 'bg-sky-400',
  purple: 'bg-purple-400',
  neutral: 'bg-slate-400'
};

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'sm',
  hasDot = false,
  className = ''
}) => {
  const variantClass = VARIANTS[variant] || VARIANTS.neutral;
  const dotColor = DOT_COLORS[variant] || DOT_COLORS.neutral;
  const sizeClass = size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border tracking-wide uppercase ${variantClass} ${sizeClass} ${className}`}
    >
      {hasDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
