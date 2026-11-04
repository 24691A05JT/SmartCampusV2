import { useState, useEffect, useCallback } from 'react';
import {
  Award,
  Search,
  Filter,
  Download,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatCard from '../components/common/StatCard';
import SkeletonLoader from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import CertificatePreviewModal from '../components/certificates/CertificatePreviewModal';
import { useToast } from '../context/ToastContext';
import apiClient from '../services/apiClient';

export const AdminCertificatesPage = () => {
  const toast = useToast();
  const addToast = (msg, type = 'info') => {
    if (typeof toast?.addToast === 'function') toast.addToast(msg, type);
    else if (typeof toast?.[type] === 'function') toast[type](msg);
    else if (typeof toast?.showToast === 'function') toast.showToast({ type, message: msg });
  };

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });

  // Action Modals State
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);

  const [reinstateTarget, setReinstateTarget] = useState(null);
  const [reinstateReason, setReinstateReason] = useState('');
  const [isReinstating, setIsReinstating] = useState(false);

  // Preview & Download
  const [previewCert, setPreviewCert] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchCertificates = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiClient.get('/certificates/admin/all', { params });
      setCertificates(res.data?.certificates || []);
      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load certificates registry:', err);
      addToast('Failed to load certificate registry records.', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchCertificates(1);
  }, [fetchCertificates]);

  // Handle Revoke
  const handleConfirmRevoke = async () => {
    if (!revokeTarget) return;
    if (!revokeReason || revokeReason.trim().length < 3) {
      addToast('Please enter a detailed revocation reason (min 3 chars).', 'error');
      return;
    }

    setIsRevoking(true);
    try {
      await apiClient.patch(`/certificates/${revokeTarget.certificateId}/revoke`, {
        reason: revokeReason.trim()
      });
      addToast(`Certificate ${revokeTarget.certificateId} has been revoked.`, 'success');
      setRevokeTarget(null);
      setRevokeReason('');
      fetchCertificates(pagination.page);
    } catch (err) {
      console.error('Revocation error:', err);
      addToast(err.response?.data?.message || 'Failed to revoke certificate.', 'error');
    } finally {
      setIsRevoking(false);
    }
  };

  // Handle Reinstate
  const handleConfirmReinstate = async () => {
    if (!reinstateTarget) return;
    setIsReinstating(true);
    try {
      await apiClient.patch(`/certificates/${reinstateTarget.certificateId}/reinstate`, {
        reason: reinstateReason.trim() || 'Administrative reinstatement'
      });
      addToast(`Certificate ${reinstateTarget.certificateId} reinstated successfully.`, 'success');
      setReinstateTarget(null);
      setReinstateReason('');
      fetchCertificates(pagination.page);
    } catch (err) {
      console.error('Reinstatement error:', err);
      addToast(err.response?.data?.message || 'Failed to reinstate certificate.', 'error');
    } finally {
      setIsReinstating(false);
    }
  };

  // Handle Download PDF (Admin allows downloading with watermark even if revoked)
  const handleDownload = async (cert) => {
    setDownloadingId(cert.certificateId);
    try {
      const res = await apiClient.get(`/certificates/${cert.certificateId}/download?allowRevoked=true`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SmartCampus-Certificate-${cert.certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      addToast('Certificate downloaded successfully.', 'success');
    } catch (err) {
      console.error('Download error:', err);
      addToast(err.response?.data?.message || 'Failed to download certificate PDF.', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Institutional Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Certificate Registry & Governance
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Audit, verify, and moderate all student co-curricular credentials across the university.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCertificates(pagination.page)}
            className="text-xs"
          >
            Refresh Registry
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Total Issued Certificates"
          value={pagination.total}
          icon={Award}
          description="Credentials recorded in campus registry"
        />

        <StatCard
          title="Active Valid Credentials"
          value={certificates.filter((c) => c.status === 'valid').length}
          icon={ShieldCheck}
          trend="Active"
          isPositive={true}
          description="Legitimate credentials on public record"
        />

        <StatCard
          title="Revoked Credentials"
          value={certificates.filter((c) => c.status === 'revoked').length}
          icon={ShieldAlert}
          description="Flagged or invalidated credentials"
        />
      </div>

      {/* Filters & Search */}
      <div className="glass-card rounded-2xl border border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['all', 'valid', 'revoked'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Certificate ID..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Registry Table */}
      {loading ? (
        <SkeletonLoader height="360px" className="rounded-2xl" />
      ) : certificates.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No Certificates Found"
          description="No credentials match the current filter or search criteria."
        />
      ) : (
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Certificate ID</th>
                  <th className="py-3.5 px-4">Recipient Student</th>
                  <th className="py-3.5 px-4">Event & Category</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {certificates.map((cert) => {
                  const student = cert.student || {};
                  const event = cert.event || {};
                  const isValid = cert.status === 'valid';

                  return (
                    <tr key={cert._id} className="hover:bg-slate-800/30 transition-colors">
                      {/* ID */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-indigo-400 font-bold bg-slate-900 px-2 py-1 rounded border border-slate-800">
                          {cert.certificateId}
                        </span>
                      </td>

                      {/* Student */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white text-xs">{student.name || 'Student'}</p>
                        <p className="text-slate-400 text-[11px]">
                          {student.department || 'General'} {student.year ? `• Year ${student.year}` : ''}
                        </p>
                      </td>

                      {/* Event */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white text-xs line-clamp-1">{event.title || 'Event'}</p>
                        <Badge variant="purple" size="sm" className="mt-1">
                          {event.category || 'Event'}
                        </Badge>
                      </td>

                      {/* Issue Date */}
                      <td className="py-3.5 px-4 text-slate-400">
                        {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : '—'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isValid ? (
                          <Badge variant="success" size="sm" hasDot>
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="sm" hasDot>
                            Revoked
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewCert(cert)}
                            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition"
                            title="Preview Certificate"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownload(cert)}
                            disabled={downloadingId === cert.certificateId}
                            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-indigo-400 border border-slate-800 transition"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {isValid ? (
                            <button
                              type="button"
                              onClick={() => {
                                setRevokeTarget(cert);
                                setRevokeReason('');
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold transition"
                            >
                              Revoke
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setReinstateTarget(cert);
                                setReinstateReason('');
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold transition flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reinstate</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
              <span className="text-xs text-slate-400">
                Page {pagination.page} of {pagination.pages} ({pagination.total} records)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchCertificates(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchCertificates(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Revoke Confirmation Dialog */}
      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Revoke Certificate</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are revoking certificate <strong className="text-rose-400 font-mono">{revokeTarget.certificateId}</strong> issued to <strong>{revokeTarget.student?.name}</strong>. This action will be recorded in the security audit trail and will invalidate public verification.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Mandatory Revocation Reason:</label>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Specify the reason (e.g. academic integrity breach, attendance discrepancy)..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setRevokeTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmRevoke}
                isLoading={isRevoking}
                disabled={!revokeReason || revokeReason.trim().length < 3}
              >
                Confirm Revocation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reinstate Confirmation Dialog */}
      {reinstateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Reinstate Certificate</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Restore validity for certificate <strong className="text-emerald-400 font-mono">{reinstateTarget.certificateId}</strong>. The certificate status will return to <strong className="text-emerald-400">valid</strong>.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Reinstatement Note (Audit Log):</label>
              <input
                type="text"
                value={reinstateReason}
                onChange={(e) => setReinstateReason(e.target.value)}
                placeholder="Reason for clearance / reinstatement..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setReinstateTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmReinstate}
                isLoading={isReinstating}
              >
                Confirm Reinstatement
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Preview Modal */}
      <CertificatePreviewModal
        isOpen={Boolean(previewCert)}
        onClose={() => setPreviewCert(null)}
        certificate={previewCert}
        onDownload={handleDownload}
        isDownloading={downloadingId === previewCert?.certificateId}
      />
    </div>
  );
};

export default AdminCertificatesPage;
