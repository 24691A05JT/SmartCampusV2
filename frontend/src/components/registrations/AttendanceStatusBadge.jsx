import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

export const AttendanceStatusBadge = ({ status, className = '' }) => {
  switch (status) {
    case 'present':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Present</span>
        </span>
      );
    case 'absent':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 ${className}`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Absent</span>
        </span>
      );
    case 'unmarked':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 ${className}`}
        >
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Unmarked</span>
        </span>
      );
  }
};

export default AttendanceStatusBadge;
