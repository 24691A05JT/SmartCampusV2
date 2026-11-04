import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Download, Eye, ExternalLink, Calendar, MapPin, ShieldCheck, AlertOctagon, CheckCircle2 } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';

export const CertificateCard = ({ certificate, onPreview, onDownload, isDownloading }) => {
  const event = certificate.event || {};
  const isValid = certificate.status === 'valid';

  const formattedEventDate = event.date
    ? new Date(event.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Date TBA';

  const formattedIssueDate = certificate.issueDate
    ? new Date(certificate.issueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Recently';

  return (
    <div
      className={`glass-card rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative group shadow-xl ${
        isValid
          ? 'border-indigo-500/20 hover:border-indigo-500/40'
          : 'border-rose-500/30 hover:border-rose-500/50 bg-rose-950/10'
      }`}
    >
      {/* Top Accent Strip */}
      <div
        className={`h-1.5 w-full ${
          isValid
            ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500'
            : 'bg-rose-500'
        }`}
      />

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Header Metadata */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <Badge variant={event.category ? 'purple' : 'neutral'} size="sm">
              {event.category || 'Event'}
            </Badge>

            {isValid ? (
              <Badge variant="success" size="sm" hasDot>
                Valid Credential
              </Badge>
            ) : (
              <Badge variant="danger" size="sm" hasDot>
                Revoked
              </Badge>
            )}
          </div>

          <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition line-clamp-2">
            {event.title || 'Campus Event Certificate'}
          </h3>

          <div className="space-y-1.5 text-xs text-slate-400 mt-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Conducted: {formattedEventDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">{event.venue || 'Campus Facility'}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Issued on: {formattedIssueDate}</span>
            </div>
          </div>
        </div>

        {/* Certificate ID Pill & Verification */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between gap-2 bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Credential ID</span>
              <span className="font-mono text-xs font-bold text-indigo-300">
                {certificate.certificateId}
              </span>
            </div>

            <Link
              to={`/verify/${certificate.certificateId}`}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
              title="Verify Authenticity"
              target="_blank"
            >
              <span>Verify</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreview(certificate)}
            className="gap-1.5 text-xs"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Preview</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onDownload(certificate)}
            disabled={!isValid || isDownloading}
            className="gap-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? 'Downloading...' : 'PDF'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CertificateCard;
