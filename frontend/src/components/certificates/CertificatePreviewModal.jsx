import { Award, Download, X, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';

export const CertificatePreviewModal = ({ isOpen, onClose, certificate, onDownload, isDownloading }) => {
  if (!isOpen || !certificate) return null;

  const event = certificate.event || {};
  const student = certificate.student || {};
  const isValid = certificate.status === 'valid';

  const formattedEventDate = event.date
    ? new Date(event.date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Date TBA';

  const formattedIssueDate = certificate.issueDate
    ? new Date(certificate.issueDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Official Issue Date';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Official Certificate Preview</h3>
              <p className="text-xs text-slate-400 font-mono">{certificate.certificateId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onDownload(certificate)}
              disabled={!isValid || isDownloading}
              className="gap-1.5 text-xs hidden sm:flex"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Downloading...' : 'Download PDF'}</span>
            </Button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Styled Certificate Rendering */}
        <div className="p-4 sm:p-8 bg-slate-950/40">
          <div className="relative bg-slate-950 border-2 border-slate-700 rounded-2xl p-6 sm:p-10 shadow-2xl overflow-hidden">
            {/* Double Ornamental Framing */}
            <div className="absolute inset-2 border border-amber-500/40 rounded-xl pointer-events-none" />
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-amber-500" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-amber-500" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-amber-500" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-amber-500" />

            {/* Revoked Watermark */}
            {!isValid && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-20">
                <div className="transform -rotate-12 bg-rose-600/20 border-4 border-rose-500 px-12 py-3 rounded-2xl backdrop-blur-sm">
                  <span className="text-3xl sm:text-5xl font-black text-rose-500 tracking-widest uppercase">
                    REVOKED - VOID
                  </span>
                </div>
              </div>
            )}

            {/* Certificate Content */}
            <div className="relative z-10 text-center space-y-4">
              {/* Header */}
              <div>
                <h4 className="text-sm sm:text-base font-black tracking-widest text-slate-300 uppercase">
                  SMART CAMPUS UNIVERSITY
                </h4>
                <p className="text-[10px] tracking-widest text-slate-400 uppercase font-semibold">
                  OFFICE OF ACADEMIC AFFAIRS & STUDENT ENGAGEMENT
                </p>
                <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-2" />
              </div>

              {/* Title */}
              <div className="py-2">
                <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-wide">
                  CERTIFICATE OF PARTICIPATION
                </h2>
                <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">
                  AND CO-CURRICULAR EXCELLENCE
                </p>
              </div>

              {/* Presented To */}
              <div>
                <p className="text-xs italic text-slate-400">This certificate is proudly awarded to</p>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-indigo-300 uppercase tracking-wider py-1">
                  {student.name || 'Honored Student'}
                </h1>
                <p className="text-xs text-slate-400">
                  {student.department || 'Department of Computer Science'} • {student.year ? `Year ${student.year}` : 'Student'}
                </p>
              </div>

              {/* Event Description */}
              <div className="max-w-2xl mx-auto text-xs text-slate-300 leading-relaxed py-2">
                <p>
                  for outstanding participation, active presence, and distinguished engagement in the campus event
                </p>
                <p className="text-base sm:text-lg font-bold text-white mt-1">
                  "{event.title || 'Campus Event'}"
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Category: {event.category || 'Workshop'} | Venue: {event.venue || 'Campus Facility'} | Date: {formattedEventDate}
                </p>
              </div>

              {/* Signature Blocks */}
              <div className="pt-6 sm:pt-10 grid grid-cols-2 gap-8 max-w-xl mx-auto">
                <div className="text-center">
                  <div className="w-32 sm:w-40 h-px bg-slate-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-white">
                    {event.organizer?.name || 'Faculty Convener'}
                  </p>
                  <p className="text-[10px] text-slate-400">Event Convener</p>
                </div>

                <div className="text-center">
                  <div className="w-32 sm:w-40 h-px bg-slate-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-white">Dr. Rajesh Kumar</p>
                  <p className="text-[10px] text-slate-400">Dean of Student Affairs</p>
                </div>
              </div>

              {/* Verification Bar */}
              <div className="mt-6 pt-4 border-t border-slate-800 text-[10px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-900/50 p-2.5 rounded-xl">
                <span className="font-mono text-slate-300">
                  ID: <strong className="text-indigo-400">{certificate.certificateId}</strong>
                </span>
                <span>Issued: {formattedIssueDate}</span>
                <span className="font-mono text-slate-400 truncate max-w-xs">
                  Hash: {certificate.verificationHash ? `${certificate.verificationHash.slice(0, 24)}...` : 'Verified'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            {isValid ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Authentic Credential Verified</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Certificate Status: Revoked</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onDownload(certificate)}
              disabled={!isValid || isDownloading}
              className="gap-1.5 text-xs sm:hidden"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Downloading...' : 'PDF'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreviewModal;
