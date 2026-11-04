import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export const UserStatusModal = ({
  isOpen,
  onClose,
  user,
  onConfirm,
  loading = false
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen, user]);

  if (!user) return null;

  const isDeactivating = user.isActive;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 3) {
      setError(
        isDeactivating
          ? 'A suspension reason is mandatory and must be at least 3 characters.'
          : 'A reactivation reason is mandatory and must be at least 3 characters.'
      );
      return;
    }

    onConfirm({
      userId: user._id,
      isActive: !user.isActive,
      reason: reason.trim()
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isDeactivating ? 'Suspend User Account' : 'Reactivate User Account'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          {isDeactivating ? (
            <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
          ) : (
            <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
          )}
          <div className="text-sm">
            <p className="font-semibold text-white">
              Target: <span className="text-indigo-400">{user.name}</span> ({user.email})
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Role: <span className="capitalize text-slate-300">{user.role}</span>
              {user.department ? ` • ${user.department}` : ''}
            </p>
          </div>
        </div>

        {isDeactivating ? (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/90 leading-relaxed">
              <strong>Immediate Access Revocation:</strong> Suspending this account will immediately
              invalidate active sessions. The user will be blocked from logging in or making API
              requests until reinstated.
            </p>
          </div>
        ) : (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              <strong>Account Restoration:</strong> Reactivating this account will allow the user to
              log in again and resume standard platform access.
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            {isDeactivating ? 'Mandatory Suspension Reason' : 'Mandatory Reactivation Reason / Notes'}
            <span className="text-rose-400 ml-1">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            placeholder={
              isDeactivating
                ? 'State the specific violation or governance rationale (e.g. Disciplinary breach of code of conduct)...'
                : 'Optional administrative notes explaining reinstatement...'
            }
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
          {error && <p className="text-xs text-rose-400 mt-1 font-medium">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={isDeactivating ? 'danger' : 'success'}
            loading={loading}
          >
            {isDeactivating ? 'Confirm Suspension' : 'Confirm Reactivation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserStatusModal;
