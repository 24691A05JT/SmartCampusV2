import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Globe,
  User,
  Layers,
  FileText,
  Activity
} from 'lucide-react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';

export const AuditDetailModal = ({ isOpen, onClose, log }) => {
  if (!log) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionVariant = (action = '') => {
    if (action.includes('DEACTIVATED') || action.includes('REVOKED') || action.includes('CANCELLED')) {
      return 'danger';
    }
    if (action.includes('APPROVED') || action.includes('REACTIVATED') || action.includes('ISSUED')) {
      return 'success';
    }
    if (action.includes('REJECTED') || action.includes('UPDATE') || action.includes('WARNING')) {
      return 'warning';
    }
    return 'primary';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Audit Event Inspection"
      description={`Record ID: ${log._id}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Block */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={getActionVariant(log.action)} size="sm">
                {log.action}
              </Badge>
              <span className="text-xs text-slate-400">
                {log.status === 'success' ? (
                  <span className="text-emerald-400 font-medium">SUCCESS</span>
                ) : (
                  <span className="text-rose-400 font-medium">FAILURE</span>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {formatDate(log.createdAt || log.timestamp)}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 block">Target Entity</span>
            <span className="text-xs font-semibold text-slate-300">
              {log.targetType || 'System'} {log.targetId ? `(${String(log.targetId).substring(0, 8)}...)` : ''}
            </span>
          </div>
        </div>

        {/* Actor & Environment Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" /> Initiator (Actor)
            </h4>
            <div className="text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Name:</span>
                <span className="text-slate-200 font-medium">{log.performedBy?.name || 'System / Automated'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-200 font-medium">{log.performedBy?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Role:</span>
                <span className="capitalize text-slate-200 font-medium">{log.performedBy?.role || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-sky-400" /> Network Context
            </h4>
            <div className="text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">IP Address:</span>
                <span className="text-slate-200 font-mono">{log.ipAddress || '127.0.0.1'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-400">User Agent:</span>
                <span className="text-slate-300 font-mono text-[10px] break-all bg-slate-950 p-1.5 rounded border border-slate-800">
                  {log.userAgent || 'Internal API Client'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Change / Details Payload */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-400" /> Event Details & Audit Payload
          </h4>
          <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-56">
            {JSON.stringify(log.details || log.metadata || {}, null, 2)}
          </pre>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Inspection
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AuditDetailModal;
