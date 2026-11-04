import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Calendar,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Activity,
  User,
  Layers,
  FileCheck,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import apiClient from '../services/apiClient';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatCard from '../components/common/StatCard';
import SkeletonLoader from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';
import AuditDetailModal from '../components/admin/AuditDetailModal';

export const AdminAuditLogsPage = () => {
  const toast = useToast();
  const addToast = (msg, type = 'info') => {
    if (typeof toast?.addToast === 'function') toast.addToast(msg, type);
    else if (typeof toast?.[type] === 'function') toast[type](msg);
    else if (typeof toast?.showToast === 'function') toast.showToast({ type, message: msg });
  };

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });

  // Inspection modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalLogs: 0,
    securityActions: 0,
    eventActions: 0,
    certActions: 0
  });

  const fetchLogs = useCallback(async (page = 1) => {
    // Validate date range if both provided
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      addToast('Start date cannot be after end date', 'warning');
      return;
    }

    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (actionFilter !== 'all') params.action = actionFilter;
      if (targetTypeFilter !== 'all') params.targetType = targetTypeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiClient.get('/admin/audit-logs', { params });
      if (res?.success) {
        setLogs(res.data?.logs || []);
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
          totalLogs: res.data?.pagination?.total ?? prev.totalLogs
        }));
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      addToast(err.response?.data?.message || err.message || 'Failed to load audit trail', 'error');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, targetTypeFilter, startDate, endDate, searchQuery]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  // Load summary metrics on mount
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await apiClient.get('/admin/dashboard');
        if (res?.success) {
          const s = res.data?.summary || res.data?.metrics || {};
          setStats((prev) => ({
            ...prev,
            totalLogs: s.totalAuditLogs || 0
          }));
        }
      } catch (err) {
        console.warn('Could not load audit summary:', err);
      }
    };
    fetchSummary();
  }, []);

  const handleInspect = (log) => {
    setSelectedLog(log);
    setInspectModalOpen(true);
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

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl">
        <div>
          <Badge variant="danger" size="sm" hasDot className="mb-2">
            Institutional Audit
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Security & Governance Audit Trail
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable log of all administrative interventions, approvals, cancellations, and identity modifications
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={() => fetchLogs(pagination.page)}
        >
          Refresh Audit Stream
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Audit Events"
          value={String(stats.totalLogs)}
          icon={Activity}
          trend="Append-only records"
          accentColor="indigo"
        />
        <StatCard
          title="Account Interventions"
          value={String(logs.filter((l) => l.action?.includes('USER_')).length)}
          icon={User}
          trend="In current page view"
          accentColor="rose"
        />
        <StatCard
          title="Event Moderations"
          value={String(logs.filter((l) => l.action?.includes('EVENT_')).length)}
          icon={Layers}
          trend="In current page view"
          accentColor="amber"
        />
        <StatCard
          title="Certificate Operations"
          value={String(logs.filter((l) => l.action?.includes('CERTIFICATE_')).length)}
          icon={FileCheck}
          trend="In current page view"
          accentColor="emerald"
        />
      </div>

      {/* Main Audit Card */}
      <Card
        title="Audit Event Stream"
        subtitle="Chronological inspection of campus governance actions with cryptographic traceability"
      >
        {/* Filters Bar */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search action, target, IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchLogs(1);
                }}
                className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            {/* Action Select */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="all">All Actions</option>
              <option value="USER_SUSPENDED">User Suspended</option>
              <option value="USER_REACTIVATED">User Reactivated</option>
              <option value="EVENT_APPROVED">Event Approved</option>
              <option value="EVENT_REJECTED">Event Rejected</option>
              <option value="EVENT_CANCELLED_BY_ADMIN">Event Cancelled by Admin</option>
              <option value="REGISTRATION_CANCELLED_BY_ADMIN">Registration Cancelled</option>
              <option value="CERTIFICATE_ISSUED">Certificate Issued</option>
              <option value="CERTIFICATE_REVOKED">Certificate Revoked</option>
              <option value="CERTIFICATE_REINSTATED">Certificate Reinstated</option>
            </select>

            {/* Target Type Select */}
            <select
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="all">All Target Types</option>
              <option value="User">User</option>
              <option value="Event">Event</option>
              <option value="Registration">Registration</option>
              <option value="Certificate">Certificate</option>
              <option value="Feedback">Feedback</option>
            </select>

            {/* Date Filters */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-1/2 px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                title="Start Date"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-1/2 px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                title="End Date"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Filter results across institutional database</span>
            <div className="flex items-center gap-2">
              {(actionFilter !== 'all' || targetTypeFilter !== 'all' || startDate || endDate || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setActionFilter('all');
                    setTargetTypeFilter('all');
                    setStartDate('');
                    setEndDate('');
                    setSearchQuery('');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 transition"
                >
                  Reset Filters
                </button>
              )}
              <Button variant="ghost" size="sm" onClick={() => fetchLogs(1)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonLoader height="60px" className="rounded-xl" />
            <SkeletonLoader height="60px" className="rounded-xl" />
            <SkeletonLoader height="60px" className="rounded-xl" />
            <SkeletonLoader height="60px" className="rounded-xl" />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="No Audit Records Found"
            description="No logged administrative events match your filter parameters."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActionFilter('all');
                  setTargetTypeFilter('all');
                  setStartDate('');
                  setEndDate('');
                  setSearchQuery('');
                }}
              >
                Clear All Filters
              </Button>
            }
            className="py-12"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Initiator</th>
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {logs.map((log) => (
                  <tr
                    key={log._id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-xs text-slate-300 font-mono">
                      {formatDate(log.createdAt || log.timestamp)}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4">
                      <Badge variant={getActionVariant(log.action)} size="sm">
                        {log.action}
                      </Badge>
                    </td>

                    {/* Initiator */}
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-medium text-white">
                        {log.performedBy?.name || 'Automated System'}
                      </div>
                      <div className="text-slate-500">
                        {log.performedBy?.email || 'System'} • {log.performedBy?.role || 'Daemon'}
                      </div>
                    </td>

                    {/* Target */}
                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-semibold text-slate-300">
                        {log.targetType || 'System'}
                      </span>
                      {log.targetId && (
                        <span className="text-slate-500 font-mono text-[11px] block">
                          ID: {String(log.targetId).substring(0, 10)}...
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {log.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-rose-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          Failure
                        </span>
                      )}
                    </td>

                    {/* Inspect Button */}
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => handleInspect(log)}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
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
                onClick={() => fetchLogs(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                rightIcon={<ChevronRight className="w-4 h-4" />}
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchLogs(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Inspect Modal */}
      <AuditDetailModal
        isOpen={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        log={selectedLog}
      />
    </div>
  );
};

export default AdminAuditLogsPage;
