import { Loader2 } from 'lucide-react';

export const RouteLoadingFallback = ({ message = 'Loading campus workspace...' }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[50vh] flex flex-col items-center justify-center p-8 select-none animate-in fade-in duration-200"
    >
      <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10 animate-pulse">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-slate-300">{message}</p>
      <span className="sr-only">Please wait, loading view content...</span>
    </div>
  );
};

export default RouteLoadingFallback;
