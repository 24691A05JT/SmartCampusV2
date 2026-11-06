import { useState, useEffect, useCallback, useMemo } from 'react';
import { Award, Search, Download, ShieldCheck, Clock, CheckCircle2, AlertCircle, FileText, Sparkles, Filter } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import SkeletonLoader from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';
import CertificateCard from '../components/certificates/CertificateCard';
import CertificatePreviewModal from '../components/certificates/CertificatePreviewModal';
import { useToast } from '../context/ToastContext';
import apiClient from '../services/apiClient';

export const StudentCertificatesPage = () => {
  const toast = useToast();
  const addToast = (msg, type = 'info') => {
    if (typeof toast?.addToast === 'function') toast.addToast(msg, type);
    else if (typeof toast?.[type] === 'function') toast[type](msg);
    else if (typeof toast?.showToast === 'function') toast.showToast({ type, message: msg });
  };

  const [certificates, setCertificates] = useState([]);
  const [eligibleEvents, setEligibleEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('earned');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal & Download state
  const [previewCert, setPreviewCert] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [certsRes, eligibleRes] = await Promise.all([
        apiClient.get('/certificates/my-certificates'),
        apiClient.get('/certificates/eligible')
      ]);
      setCertificates(certsRes.data || []);
      setEligibleEvents(eligibleRes.data || []);
    } catch (err) {
      console.error('Failed to load certificates:', err);
      addToast('Unable to load certificates at this time.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived Summary Stats
  const stats = useMemo(() => {
    const totalEarned = certificates.length;
    const validCount = certificates.filter((c) => c.status === 'valid').length;
    const pendingCount = eligibleEvents.filter((item) => !item.isIssued).length;
    return { totalEarned, validCount, pendingCount };
  }, [certificates, eligibleEvents]);

  // Filtered Certificates
  const filteredCertificates = useMemo(() => {
    if (!searchQuery.trim()) return certificates;
    const q = searchQuery.toLowerCase();
    return certificates.filter((c) => {
      const titleMatch = c.event?.title?.toLowerCase().includes(q);
      const catMatch = c.event?.category?.toLowerCase().includes(q);
      const idMatch = c.certificateId?.toLowerCase().includes(q);
      return titleMatch || catMatch || idMatch;
    });
  }, [certificates, searchQuery]);

  // Filtered Eligible Events
  const filteredEligible = useMemo(() => {
    if (!searchQuery.trim()) return eligibleEvents;
    const q = searchQuery.toLowerCase();
    return eligibleEvents.filter((item) => {
      const titleMatch = item.event?.title?.toLowerCase().includes(q);
      const catMatch = item.event?.category?.toLowerCase().includes(q);
      return titleMatch || catMatch;
    });
  }, [eligibleEvents, searchQuery]);

  // Handle Download PDF
  const handleDownload = async (cert) => {
    if (!cert || cert.status === 'revoked') {
      addToast('Revoked certificates cannot be downloaded.', 'error');
      return;
    }
    setDownloadingId(cert.certificateId);
    try {
      const res = await apiClient.get(`/certificates/${cert.certificateId}/download`, {
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

  // Keyboard navigation for tablist
  const handleTabKeyDown = (e, currentTab) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const nextTab = currentTab === 'earned' ? 'eligible' : 'earned';
      setActiveTab(nextTab);
      document.getElementById(`tab-${nextTab}`)?.focus();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Award className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Student Credentials Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            My Certificates & Honors
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Official cryptographically verifiable certificates of completion and co-curricular excellence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="text-xs"
          >
            Refresh Records
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Total Certificates Earned"
          value={stats.totalEarned}
          icon={Award}
          trend={`${stats.validCount} Valid`}
          isPositive={true}
          description="Issued credentials on campus record"
        />

        <StatCard
          title="Active Valid Credentials"
          value={stats.validCount}
          icon={ShieldCheck}
          trend="100% Verifiable"
          isPositive={true}
          description="Tamper-proof cryptographic hashes"
        />

        <StatCard
          title="Pending Event Honors"
          value={stats.pendingCount}
          icon={Clock}
          description="Attended events ready for issuance"
        />
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div
          role="tablist"
          aria-label="Certificate categories"
          className="flex items-center gap-2"
        >
          <button
            id="tab-earned"
            role="tab"
            aria-selected={activeTab === 'earned'}
            aria-controls="panel-earned"
            tabIndex={activeTab === 'earned' ? 0 : -1}
            type="button"
            onClick={() => setActiveTab('earned')}
            onKeyDown={(e) => handleTabKeyDown(e, 'earned')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'earned'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Earned Certificates ({certificates.length})</span>
          </button>

          <button
            id="tab-eligible"
            role="tab"
            aria-selected={activeTab === 'eligible'}
            aria-controls="panel-eligible"
            tabIndex={activeTab === 'eligible' ? 0 : -1}
            type="button"
            onClick={() => setActiveTab('eligible')}
            onKeyDown={(e) => handleTabKeyDown(e, 'eligible')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'eligible'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Attended Events ({eligibleEvents.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="search-certificates"
            aria-label="Search certificates by event or ID"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by event or ID..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Content Rendering Tab Panel */}
      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
        className="outline-none"
      >
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <SkeletonLoader key={i} height="280px" className="rounded-2xl" />
            ))}
          </div>
        ) : activeTab === 'earned' ? (
          filteredCertificates.length === 0 ? (
            <EmptyState
              icon={Award}
              title={searchQuery ? 'No Matching Certificates' : 'No Certificates Issued Yet'}
              description={
                searchQuery
                  ? `No certificates matched "${searchQuery}". Clear your search query to see all.`
                  : 'As you attend campus workshops, technical hackathons, and seminars, faculty organizers will issue your official credentials.'
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCertificates.map((cert) => (
                <CertificateCard
                  key={cert._id}
                  certificate={cert}
                  onPreview={(c) => setPreviewCert(c)}
                  onDownload={handleDownload}
                  isDownloading={downloadingId === cert.certificateId}
                />
              ))}
            </div>
          )
        ) : (
          // Eligible / Attended Events Tab
          filteredEligible.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No Attended Events Found"
              description="When you attend approved campus events and your attendance is verified by faculty, your event honors will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEligible.map((item) => {
                const ev = item.event || {};
                const eventDate = ev.date
                  ? new Date(ev.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })
                  : 'Date TBA';

                return (
                  <div
                    key={ev._id}
                    className="glass-card rounded-2xl border border-slate-800 p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge variant="purple" size="sm">
                          {ev.category || 'Event'}
                        </Badge>
                        {item.isIssued ? (
                          <Badge variant="success" size="sm" hasDot>
                            Issued
                          </Badge>
                        ) : (
                          <Badge variant="info" size="sm" hasDot>
                            Attendance Verified
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white line-clamp-1">{ev.title}</h3>
                      <p className="text-xs text-slate-400 mt-2">
                        Conducted on: {eventDate} • {ev.venue || 'Campus Venue'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      {item.isIssued ? (
                        <span className="text-xs font-mono text-indigo-400 font-semibold">
                          {item.certificate?.certificateId}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-400 flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Awaiting Faculty Issuance</span>
                        </span>
                      )}

                      {item.isIssued && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const matching = certificates.find(
                              (c) => c.certificateId === item.certificate?.certificateId
                            );
                            if (matching) setPreviewCert(matching);
                          }}
                          className="text-xs"
                        >
                          View Credential
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Preview Modal */}
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

export default StudentCertificatesPage;
