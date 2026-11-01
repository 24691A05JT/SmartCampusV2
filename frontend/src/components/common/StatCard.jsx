import { TrendingUp, TrendingDown } from 'lucide-react';

const ACCENTS = {
  indigo: {
    bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    icon: 'text-indigo-400',
    glow: 'from-indigo-500/5 to-transparent'
  },
  emerald: {
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: 'text-emerald-400',
    glow: 'from-emerald-500/5 to-transparent'
  },
  amber: {
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: 'text-amber-400',
    glow: 'from-amber-500/5 to-transparent'
  },
  rose: {
    bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    icon: 'text-rose-400',
    glow: 'from-rose-500/5 to-transparent'
  },
  sky: {
    bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    icon: 'text-sky-400',
    glow: 'from-sky-500/5 to-transparent'
  }
};

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  isPositive = true,
  accentColor = 'indigo',
  className = ''
}) => {
  const accent = ACCENTS[accentColor] || ACCENTS.indigo;

  return (
    <div
      className={`relative overflow-hidden bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:border-slate-700 hover:shadow-2xl hover:-translate-y-0.5 ${className}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${accent.glow} pointer-events-none`} />

      <div className="relative flex items-center justify-between gap-4 mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${accent.bg}`}>
            <Icon className={`w-5 h-5 ${accent.icon}`} />
          </div>
        )}
      </div>

      <div className="relative">
        <h4 className="text-3xl font-bold tracking-tight text-white mb-2">{value}</h4>

        {trend && (
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md ${
                isPositive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend}
            </span>
            {trendLabel && <span className="text-slate-400">{trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
