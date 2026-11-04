import React, { useState, useEffect, useCallback } from 'react';
import {
  Ticket,
  Search,
  Filter,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import apiClient from '../services/apiClient';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatCard from '../components/common/StatCard';
import SkeletonLoader from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';

export const AdminRegistrationsPage = () => {
  const toast = useToast();
  const addToast = (msg, type = 'info') => {
    if (typeof toast?.addToast === 'function') toast.addToast(msg, type);
    else if (typeof toast?.[type] === 'function') toast[type](msg);
    else if (typeof toast?.showToast === 'function') toast.showToast({ type, message: msg });
  };

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });

  // Cancel action state
  const [selectedReg, setSelectedReg] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Summary counts
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    cancelled: 0
  });

  const fetchRegistrations = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiClient.get('/admin/registrations', { params });
      if (res?.success) {
        setRegistrations(res.data?.registrations || []);
        if (res.data?.pagination) {
          setPagination({
            page: res.data.pagination.page,
            limit: res.data.pagination.limit,
            total: res.data.pagination.total,
            pages: res.data.pagination.pages
          });
        }
        setStats((prev) => ({
          ...prev,
          total: res.data?.pagination?.total ?? prev.total
        }));
      }
    } catch (err) {
      console.error('Failed to fetch admin registrations:', err);
      addToast(err.response?.data?.message || err.message || 'Failed to load registrations', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchRegistrations(1);
  }, [fetchRegistrations]);

  const handleOpenCancelModal = (reg) => {
    setSelectedReg(reg);
    setCancelReason('');
    setCancelError('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!cancelReason || cancelReason.trim().length < 3) {
      setCancelError('A cancellation reason of at least 3 characters is mandatory.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await apiClient.patch(`/admin/registrations/${selectedReg._id}/cancel`, {
        reason: cancelReason.trim()
      });

      if (res?.success) {
        addToast('Registration successfully cancelled and capacity restored.', 'success');
        setCancelModalOpen(false);
        fetchRegistrations(pagination.page);
      }
    } catch (err) {
      console.error('Failed to cancel registration:', err);
      addToast(err.response?.data?.message || err.message || 'Failed to cancel registration', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success" size="sm" hasDot>Confirmed</Badge>;
      case 'cancelled':
        return <Badge variant="danger" size="sm" hasDot>Cancelled</Badge>;
      case 'waitlisted':
        return <Badge variant="warning" size="sm" hasDot>Waitlisted</Badge>;
      default:
        return <Badge variant="primary" size="sm">{status}</Badge>;
    }
  };

  const getAttendanceBadge = (status) => {
    switch (status) {
      case 'present':
        return <Badge variant="success" size="sm">Present</Badge>;
      case 'absent':
        return <Badge variant="danger" size="sm">Absent</Badge>;
      default:
        return <span className="text-xs text-slate-500 italic">Unmarked</span>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl">
        <div>
          <Badge variant="danger" size="sm" hasDot className="mb-2">
            Capacity & Registration Governance
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Campus Registrations Registry
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Audit participant rosters, inspect student commitments, and execute administrative cancellations
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={() => fetchRegistrations(pagination.page)}
        >
          Refresh Roster
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Registrations"
          value={String(stats.total)}
          icon={Ticket}
          trend={`${stats.total} total applications`}
          accentColor="indigo"
        />
        <StatCard
          title="Active in View"
          value={String(registrations.filter((r) => r.status === 'confirmed').length)}
          icon={CheckCircle}
          trend="Confirmed reservations"
          accentColor="emerald"
        />
        <StatCard
          title="Cancelled in View"
          value={String(registrations.filter((r) => r.status === 'cancelled').length)}
          icon={XCircle}
          trend="Released slots"
          accentColor="rose"
        />
      </div>

      {/* Registry Table Card */}
      <Card
        title="Student Registration Roster"
        subtitle="Manage and moderate student bookings across all campus events"
      >
        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student or event title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSearchQuery(searchTerm);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {['all', 'confirmed', 'cancelled', 'waitlisted'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition font-medium ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'all' ? 'All Registrations' : st}
                </button>
              ))}
            </div>

            <Button variant="ghost" size="sm" onClick={() => setSearchQuery(searchTerm)}>
              Filter
            </Button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonLoader height="60px" className="rounded-xl" />
            <SkeletonLoader height="60px" className="rounded-xl" />
            <SkeletonLoader height="60px" className="rounded-xl" />
            <SkeletonLoader height="60px" className="rounded-xl" />
          </div>
        ) : registrations.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No Registrations Found"
            description="No registration records match your filter criteria."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </Button>
            }
            className="py-12"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Attendance</th>
                  <th className="py-3 px-4">Registered On</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {registrations.map((reg) => {
                  const student = reg.student || {};
                  const event = reg.event || {};
                  const isCancelled = reg.status === 'cancelled';

                  return (
                    <tr
                      key={reg._id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Student info */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-white">
                          {student.name || 'Unknown Student'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {student.email || '—'} {student.department ? `• ${student.department}` : ''}
                        </div>
                      </td>

                      {/* Event Info */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-indigo-300">
                          {event.title || 'Unknown Event'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {event.venue || 'TBA'} • {formatDate(event.date)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {getStatusBadge(reg.status)}
                      </td>

                      {/* Attendance */}
                      <td className="py-4 px-4">
                        {getAttendanceBadge(reg.attendanceStatus)}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 text-xs text-slate-400">
                        {formatDate(reg.createdAt)}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-right">
                        {!isCancelled ? (
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<XCircle className="w-3.5 h-3.5" />}
                            onClick={() => handleOpenCancelModal(reg)}
                          >
                            Cancel
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-500 italic">
                            Cancelled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-4">
            <span className="text-xs text-slate-400">
              Showing page <strong className="text-white">{pagination.page}</strong> of{' '}
              <strong className="text-white">{pagination.pages}</strong> ({pagination.total} total)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ChevronLeft className="w-4 h-4" />}
                disabled={pagination.page <= 1}
                onClick={() => fetchRegistrations(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                rightIcon={<ChevronRight className="w-4 h-4" />}
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchRegistrations(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Cancel Registration Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Student Registration"
        size="md"
      >
        <form onSubmit={handleConfirmCancel} className="space-y-4">
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
            <p className="text-sm font-semibold text-white">
              Student: <span className="text-indigo-400">{selectedReg?.student?.name}</span>
            </p>
            <p className="text-xs text-slate-400">
              Event: <span className="text-slate-300 font-medium">{selectedReg?.event?.title}</span>
            </p>
          </div>

          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-200/90 leading-relaxed">
              Cancelling this registration will release one seat in event capacity and notify the student.
              This action cannot be undone and will be logged in the campus audit trail.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Cancellation Reason <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value);
                if (cancelError) setCancelError('');
              }}
              placeholder="Provide justification (e.g. Ineligible year group, student requested withdrawal)..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            {cancelError && <p className="text-xs text-rose-400 mt-1 font-medium">{cancelError}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCancelModalOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={actionLoading}
            >
              Confirm Cancellation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminRegistrationsPage;
