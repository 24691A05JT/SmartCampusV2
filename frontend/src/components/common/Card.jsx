export const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  hoverable = false,
  className = '',
  bodyClassName = ''
}) => {
  return (
    <div
      className={`bg-slate-900/70 backdrop-blur-md border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl transition-all duration-200 ${
        hoverable
          ? 'hover:border-slate-700 hover:shadow-2xl hover:-translate-y-0.5'
          : ''
      } ${className}`}
    >
      {(title || headerAction) && (
        <div className="px-6 py-4 border-b border-slate-800/70 flex items-center justify-between gap-4">
          <div>
            {title && <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}

      <div className={`p-6 ${bodyClassName}`}>{children}</div>

      {footer && (
        <div className="px-6 py-3.5 bg-slate-950/40 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
