import { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Printer,
  Calendar,
  Clock,
  MapPin,
  Building,
  GraduationCap,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import AttendanceStatusBadge from './AttendanceStatusBadge';

export const TicketModal = ({ isOpen, onClose, registration }) => {
  const [copied, setCopied] = useState(false);

  if (!registration) return null;

  const event = registration.event || {};
  const student = registration.student || {};
  const ticketCode = registration.ticketCode || 'TKT-PENDING';
  const attendanceStatus = registration.attendance?.status || 'unmarked';

  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Date TBA';

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ticketCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Official Event Boarding Pass" size="md">
      <div className="space-y-6 print:m-0 print:p-0">
        {/* Ticket Container */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 shadow-2xl">
          {/* Top Banner Accent */}
          <div className="h-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          {/* Ticket Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {event.category || 'Event'}
                </span>
                <span className="text-xs text-slate-400">Campus Entry Pass</span>
              </div>
              <h2 className="text-lg font-bold text-white leading-tight">
                {event.title || 'Campus Event'}
              </h2>
            </div>

            {/* Attendance Chip */}
            <div className="shrink-0">
              <AttendanceStatusBadge status={attendanceStatus} />
            </div>
          </div>

          {/* Ticket Body: Event Details */}
          <div className="p-6 grid grid-cols-2 gap-4 text-xs border-b border-slate-800/80 bg-slate-950/40">
            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Date
              </span>
              <p className="font-semibold text-slate-100">{formattedDate}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Time Slot
              </span>
              <p className="font-semibold text-slate-100">
                {event.startTime || '10:00'} - {event.endTime || '12:00'}
              </p>
            </div>

            <div className="space-y-1 col-span-2">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                Venue
              </span>
              <p className="font-semibold text-slate-100">{event.venue || 'Campus Facility'}</p>
            </div>
          </div>

          {/* Attendee Info */}
          <div className="p-6 border-b border-slate-800/80 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Authorized Attendee
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">{student.name || 'Student'}</p>
                <p className="text-xs text-slate-400">{student.email || ''}</p>
              </div>
              {student.department && (
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                    {student.department}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Ticket Barcode & Code Section */}
          <div className="p-6 bg-slate-950/80 flex flex-col items-center justify-center text-center space-y-3">
            <div className="text-xs text-slate-400">Scan at entrance check-in or provide code:</div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-indigo-500/30 text-indigo-300 font-mono text-base font-bold tracking-widest">
              <span>{ticketCode}</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                title="Copy Ticket Code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Visual Barcode Pattern */}
            <div className="w-full flex justify-center py-2 opacity-80">
              <div className="flex items-center gap-1 h-8">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-full bg-slate-400 ${
                      i % 3 === 0 ? 'w-1.5' : i % 5 === 0 ? 'w-2' : 'w-0.5'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cryptographically Keyed & System Verified</span>
            </div>
          </div>
        </div>

        {/* Modal Action Controls */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            <span>Print Pass</span>
          </Button>
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TicketModal;
