import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Eye,
  GraduationCap,
  Building,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import apiClient from '../services/apiClient';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatCard from '../components/common/StatCard';
import SkeletonLoader from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';
import UserDetailModal from '../components/admin/UserDetailModal';
import UserStatusModal from '../components/admin/UserStatusModal';

export const AdminUsersPage = () => {
  const { user: currentAdmin } = useAuth();
  const toast = useToast();
  const addToast = (msg, type = 'info') => {
    if (typeof toast?.addToast === 'function') toast.addToast(msg, type);
    else if (typeof toast?.[type] === 'function') toast[type](msg);
    else if (typeof toast?.showToast === 'function') toast.showToast({ type, message: msg });
  };

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  // High-level counts
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeStudents: 0,
    organizers: 0,
    suspended: 0
  });

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.isActive = statusFilter === 'active';
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiClient.get('/admin/users', { params });
      if (res?.success) {
        setUsers(res.data?.users || []);
        if (res.data?.pagination) {
          setPagination({
            page: res.data.pagination.page,
            limit: res.data.pagination.limit,
            total: res.data.pagination.total,
            pages: res.data.pagination.pages
          });
        }

        // Compute or update local stats overview
        const fetchedList = res.data?.users || [];
        setStats((prev) => ({
          ...prev,
          totalUsers: res.data?.pagination?.total ?? prev.totalUsers
        }));
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
      addToast(err.response?.data?.message || err.message || 'Failed to load user catalog', 'error');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, searchQuery]);

  // Load summary stats on initial mount
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await apiClient.get('/admin/dashboard');
        if (res?.success) {
          const s = res.data?.summary || res.data?.metrics || {};
          setStats({
            totalUsers: (s.totalStudents || 0) + (s.totalOrganizers || 0) + (s.totalAdmins || 0),
            activeStudents: s.totalStudents || 0,
            organizers: s.totalOrganizers || 0,
            suspended: s.suspendedUsers || s.deactivatedUsers || 0
          });
        }
      } catch (err) {
        console.warn('Could not load summary stats:', err);
      }
    };
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleInspectUser = async (user) => {
    try {
      const res = await apiClient.get(`/admin/users/${user._id}`);
      if (res?.success) {
        setSelectedUser(res.data?.user || res.data);
      } else {
        setSelectedUser(user);
      }
    } catch {
      setSelectedUser(user);
    }
    setDetailModalOpen(true);
  };

  const handleOpenStatusModal = (user) => {
    setSelectedUser(user);
    setStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async ({ userId, isActive, reason }) => {
    setStatusLoading(true);
    try {
      const res = await apiClient.patch(`/admin/users/${userId}/status`, {
        isActive,
        reason
      });

      if (res?.success) {
        addToast(
          isActive
            ? 'User account successfully reactivated.'
            : 'User account has been suspended and access revoked.',
          'success'
        );
        setStatusModalOpen(false);
        // Refresh users list
        fetchUsers(pagination.page);
        // Refresh summary
        const summaryRes = await apiClient.get('/admin/dashboard');
        if (summaryRes?.success) {
          const s = summaryRes.data?.summary || summaryRes.data?.metrics || {};
          setStats((prev) => ({
            ...prev,
            suspended: s.suspendedUsers || s.deactivatedUsers || 0
          }));
        }
      }
    } catch (err) {
      console.error('Failed to update user status:', err);
      addToast(err.response?.data?.message || err.message || 'Failed to update user status', 'error');
    } finally {
      setStatusLoading(false);
    }
  };

  const getRoleVariant = (role) => {
    if (role === 'admin') return 'danger';
    if (role === 'organizer') return 'warning';
    return 'primary';
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl">
        <div>
          <Badge variant="danger" size="sm" hasDot className="mb-2">
            Campus Governance
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            User Accounts & Moderation
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage institutional identities, inspect user dossiers, and enforce account suspensions
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={() => fetchUsers(pagination.page)}
        >
          Refresh Directory
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Campus Users"
          value={String(stats.totalUsers)}
          icon={Users}
          trend={`${stats.totalUsers} registered accounts`}
          accentColor="indigo"
        />
        <StatCard
          title="Enrolled Students"
          value={String(stats.activeStudents)}
          icon={GraduationCap}
          trend="Eligible participants"
          accentColor="emerald"
        />
        <StatCard
          title="Faculty Organizers"
          value={String(stats.organizers)}
          icon={Building}
          trend="Event coordinators"
          accentColor="sky"
        />
        <StatCard
          title="Suspended Accounts"
          value={String(stats.suspended)}
          icon={ShieldAlert}
          trend={stats.suspended > 0 ? 'Access revoked' : 'No suspensions'}
          accentColor="rose"
        />
      </div>

      {/* Main Directory Card */}
      <Card
        title="Institutional User Directory"
        subtitle="Filter campus members by role, affiliation, and account status"
      >
        {/* Filters & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="search-users-input"
              aria-label="Search users by name, email, or student ID"
              type="text"
              placeholder="Search by name, email, student ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSearchQuery(searchTerm);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Role Filter */}
            <div
              role="group"
              aria-label="Filter users by role"
              className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs"
            >
              {['all', 'student', 'organizer', 'admin'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition font-medium ${
                    roleFilter === r
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r === 'all' ? 'All Roles' : r}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div
              role="group"
              aria-label="Filter users by account status"
              className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs"
            >
              {['all', 'active', 'suspended'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition font-medium ${
                    statusFilter === s
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s === 'all' ? 'All Status' : s}
                </button>
              ))}
            </div>

            <Button variant="ghost" size="sm" onClick={() => setSearchQuery(searchTerm)}>
              Filter
            </Button>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonLoader height="60px" className="rounded-xl" />
            <SkeletonLoader height="60px" className="rounded-xl" />
            <SkeletonLoader height="60px" className="rounded-xl" />
            <SkeletonLoader height="60px" className="rounded-xl" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Users Found"
            description="No campus members match your search criteria or active filters."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
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
            <table className="w-full text-left border-collapse" aria-label="Campus users directory">
              <caption className="sr-only">Directory of campus students, faculty organizers, and administrators</caption>
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th scope="col" className="py-3 px-4">User</th>
                  <th scope="col" className="py-3 px-4">Role</th>
                  <th scope="col" className="py-3 px-4">Department / ID</th>
                  <th scope="col" className="py-3 px-4">Status</th>
                  <th scope="col" className="py-3 px-4">Joined</th>
                  <th scope="col" className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {users.map((u) => {
                  const isCurrentAdmin = currentAdmin && String(u._id) === String(currentAdmin._id);

                  return (
                    <tr
                      key={u._id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Name & Email */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-indigo-400 shrink-0">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                              {u.name}
                              {isCurrentAdmin && (
                                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-4">
                        <Badge variant={getRoleVariant(u.role)} size="sm">
                          {u.role}
                        </Badge>
                      </td>

                      {/* Department / ID */}
                      <td className="py-4 px-4 text-xs text-slate-300">
                        <div>{u.department || '—'}</div>
                        {u.studentId && (
                          <div className="text-slate-500 font-mono text-[11px]">
                            ID: {u.studentId}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {u.isActive ? (
                          <Badge variant="success" size="sm" hasDot>
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="sm" hasDot>
                            Suspended
                          </Badge>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-4 text-xs text-slate-400">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => handleInspectUser(u)}
                            title="Inspect User Dossier"
                          >
                            Dossier
                          </Button>

                          {!isCurrentAdmin ? (
                            <Button
                              variant={u.isActive ? 'danger' : 'success'}
                              size="sm"
                              leftIcon={
                                u.isActive ? (
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                ) : (
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                )
                              }
                              onClick={() => handleOpenStatusModal(u)}
                              title={u.isActive ? 'Suspend Account' : 'Reactivate Account'}
                            >
                              {u.isActive ? 'Suspend' : 'Reactivate'}
                            </Button>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic px-2">
                              Protected
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
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
                onClick={() => fetchUsers(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                rightIcon={<ChevronRight className="w-4 h-4" />}
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchUsers(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* User Dossier Modal */}
      <UserDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        user={selectedUser}
        onToggleStatus={(u) => handleOpenStatusModal(u)}
        currentAdminId={currentAdmin?._id}
      />

      {/* User Status Modal */}
      <UserStatusModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        user={selectedUser}
        onConfirm={handleConfirmStatusChange}
        loading={statusLoading}
      />
    </div>
  );
};

export default AdminUsersPage;
