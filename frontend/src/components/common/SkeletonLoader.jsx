export const SkeletonLoader = ({
  variant = 'text',
  count = 1,
  className = ''
}) => {
  const items = Array.from({ length: count });

  if (variant === 'stat') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
        {items.map((_, i) => (
          <div
            key={i}
            className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 animate-pulse"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="h-3 bg-slate-800 rounded w-24" />
              <div className="w-10 h-10 bg-slate-800 rounded-xl" />
            </div>
            <div className="h-8 bg-slate-800 rounded w-20 mb-3" />
            <div className="h-3 bg-slate-800 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {items.map((_, i) => (
          <div
            key={i}
            className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden animate-pulse flex flex-col"
          >
            <div className="h-44 bg-slate-800/80 w-full" />
            <div className="p-6 flex-1 flex flex-col gap-3">
              <div className="flex gap-2">
                <div className="h-4 bg-slate-800 rounded-full w-16" />
                <div className="h-4 bg-slate-800 rounded-full w-20" />
              </div>
              <div className="h-6 bg-slate-800 rounded w-4/5" />
              <div className="h-3 bg-slate-800 rounded w-full" />
              <div className="h-3 bg-slate-800 rounded w-2/3" />
              <div className="mt-auto pt-4 border-t border-slate-800/50 flex justify-between items-center">
                <div className="h-3 bg-slate-800 rounded w-24" />
                <div className="h-8 bg-slate-800 rounded-xl w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden ${className}`}>
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex gap-4">
          <div className="h-4 bg-slate-800 rounded w-1/4 animate-pulse" />
          <div className="h-4 bg-slate-800 rounded w-1/4 animate-pulse" />
          <div className="h-4 bg-slate-800 rounded w-1/4 animate-pulse" />
          <div className="h-4 bg-slate-800 rounded w-1/4 animate-pulse" />
        </div>
        <div className="divide-y divide-slate-800/60">
          {items.map((_, i) => (
            <div key={i} className="p-4 flex gap-4 animate-pulse">
              <div className="h-4 bg-slate-800/80 rounded w-1/4" />
              <div className="h-4 bg-slate-800/80 rounded w-1/4" />
              <div className="h-4 bg-slate-800/80 rounded w-1/4" />
              <div className="h-4 bg-slate-800/80 rounded w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default text skeleton
  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      {items.map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-800/80 rounded-md animate-pulse"
          style={{ width: i === items.length - 1 && count > 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
};

export default SkeletonLoader;
