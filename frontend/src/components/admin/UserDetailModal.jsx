import React from 'react';
import {
  User,
  Mail,
  Building,
  GraduationCap,
  Calendar,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Award,
  Ticket,
  CalendarDays
} from 'lucide-react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';

export const UserDetailModal = ({
  isOpen,
  onClose,
  user,
  onToggleStatus,
  currentAdminId
}) => {
  if (!user) return null;

  const isSelf = currentAdminId && String(user._id) === String(currentAdminId);

  const getRoleVariant = (role) => {
    if (role === 'admin') return 'danger';
    if (role === 'organizer') return 'warning';
    return 'primary';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Dossier & Governance Record"
      description={`System ID: ${user._id}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-950/70 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-extrabold text-xl shadow-inner">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">{user.name}</h3>
                <Badge variant={getRoleVariant(user.role)} size="sm">
                  {user.role?.toUpperCase()}
                </Badge>
                {user.isActive ? (
                  <Badge variant="success" size="sm" hasDot>
                    Active
                  </Badge>
                ) : (
                  <Badge variant="danger" size="sm" hasDot>
                    Suspended
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isSelf && onToggleStatus && (
              <Button
                variant={user.isActive ? 'danger' : 'success'}
                size="sm"
                leftIcon={user.isActive ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                onClick={() => {
                  onClose();
                  onToggleStatus(user);
                }}
              >
                {user.isActive ? 'Deactivate Account' : 'Reactivate Account'}
              </Button>
            )}
            {isSelf && (
              <span className="text-xs text-amber-400 italic bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                Current Session
              </span>
            )}
          </div>
        </div>

        {/* Suspension Banner if inactive */}
        {!user.isActive && (
          <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-rose-200">
                Account Suspended by Campus Administrator
              </p>
              <p className="text-xs text-rose-300/80">
                Reason: {user.deactivationReason || 'Administrative suspension'}
              </p>
              {user.deactivatedAt && (
                <p className="text-[11px] text-rose-400/70">
                  Suspended on: {formatDate(user.deactivatedAt)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Academic & Profile Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Academic Affiliation
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5 text-xs">
                  <Building className="w-3.5 h-3.5 text-slate-500" /> Department:
                </span>
                <span className="text-slate-200 font-medium text-xs">
                  {user.department || 'Not specified'}
                </span>
              </div>
              {user.role === 'student' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5 text-xs">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-500" /> Student ID:
                    </span>
                    <span className="text-slate-200 font-medium text-xs font-mono">
                      {user.studentId || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" /> Academic Year:
                    </span>
                    <span className="text-slate-200 font-medium text-xs">
                      {user.year ? `Year ${user.year}` : 'N/A'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Account Metadata
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">Account Created:</span>
                <span className="text-slate-200 font-medium text-xs">
                  {formatDate(user.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">Last Updated:</span>
                <span className="text-slate-200 font-medium text-xs">
                  {formatDate(user.updatedAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">System Status:</span>
                <span className="text-xs font-medium">
                  {user.isActive ? (
                    <span className="text-emerald-400">Authenticated & Active</span>
                  ) : (
                    <span className="text-rose-400">Locked Out (Access Blocked)</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity & Participation Counters */}
        {user.metrics && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Campus Activity Counters
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-center">
                <Ticket className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                <span className="text-lg font-bold text-white block">
                  {user.metrics.totalRegistrations ?? 0}
                </span>
                <span className="text-[10px] text-slate-400 uppercase">Registrations</span>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-center">
                <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <span className="text-lg font-bold text-white block">
                  {user.metrics.attendedEvents ?? 0}
                </span>
                <span className="text-[10px] text-slate-400 uppercase">Attended</span>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-center">
                <Award className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <span className="text-lg font-bold text-white block">
                  {user.metrics.certificatesEarned ?? 0}
                </span>
                <span className="text-[10px] text-slate-400 uppercase">Certificates</span>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-center">
                <CalendarDays className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                <span className="text-lg font-bold text-white block">
                  {user.metrics.eventsOrganized ?? 0}
                </span>
                <span className="text-[10px] text-slate-400 uppercase">Organized</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default UserDetailModal;
