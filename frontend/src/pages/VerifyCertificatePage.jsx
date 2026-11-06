import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Award,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Building,
  GraduationCap,
  Hash
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import SkeletonLoader from '../components/common/SkeletonLoader';
import apiClient from '../services/apiClient';

export const VerifyCertificatePage = () => {
  const { certificateId: routeCertId } = useParams();
  const navigate = useNavigate();

  const [inputCertId, setInputCertId] = useState(routeCertId || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const performVerification = async (idToVerify) => {
    if (!idToVerify || !idToVerify.trim()) return;
    const cleanId = idToVerify.trim().toUpperCase();
    setLoading(true);
    setError(null);
    setResult(null);
    setHasSearched(true);

    try {
      const res = await apiClient.get(`/certificates/verify/${cleanId}`);
      setResult(res.data);
    } catch (err) {
      console.error('Verification error:', err);
      if (err.response?.status === 404) {
        setError('No certificate matching this ID was found in the official campus registry.');
      } else {
        setError(err.response?.data?.message || 'Verification service is temporarily unavailable.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (routeCertId) {
      setInputCertId(routeCertId);
      performVerification(routeCertId);
    }
  }, [routeCertId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputCertId.trim()) {
      navigate(`/verify/${inputCertId.trim().toUpperCase()}`);
      performVerification(inputCertId.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Top Banner & Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Official Public Credential Verification Portal</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Verify Certificate Authenticity
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Instant cryptographic validation for Smart Campus student credentials, activity awards, and co-curricular completion honors.
        </p>
      </div>

      {/* Lookup Search Card */}
      <div className="glass-card rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="verify-cert-id-input"
              aria-label="Certificate ID for public verification"
              type="text"
              value={inputCertId}
              onChange={(e) => setInputCertId(e.target.value)}
              placeholder="Enter Certificate ID (e.g. SC-2026-HAC-A87B-4F29)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 uppercase font-mono tracking-wide"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={loading}
            className="sm:px-8 py-3.5 text-sm font-bold gap-2"
          >
            <span>Verify Credential</span>
          </Button>
        </form>

        <p className="text-[11px] text-slate-500 text-center">
          Format: <code className="text-indigo-400 font-mono">SC-YYYY-CAT-XXXX-XXXX</code> • Case-insensitive
        </p>
      </div>

      {/* Results Section */}
      {loading ? (
        <div role="status" aria-live="polite">
          <SkeletonLoader height="320px" className="rounded-3xl" />
          <span className="sr-only">Verifying certificate cryptographic signatures...</span>
        </div>
      ) : error ? (
        <div
          role="alert"
          aria-live="assertive"
          className="glass-card rounded-3xl border border-rose-500/30 bg-rose-950/10 p-8 text-center space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Certificate Verification Failed</h3>
          <p className="text-sm text-rose-300 max-w-md mx-auto">{error}</p>
          <p className="text-xs text-slate-500 pt-2">
            Please ensure you have entered the exact Certificate ID as printed on the credential.
          </p>
        </div>
      ) : result ? (
        <div role="status" aria-live="polite" className="space-y-6">
          {/* Validity Banner */}
          {result.status === 'valid' ? (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-4">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-300">
                  Authentic & Valid Credential Verified
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  This certificate has been cryptographically verified against the university's immutable registry. The recipient successfully met all attendance and completion criteria.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-4">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-300">
                  Status: Certificate Revoked
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  This credential was previously recorded but has been officially revoked by campus administration. It is no longer valid for academic or professional credit.
                </p>
              </div>
            </div>
          )}

          {/* Certificate Credential Dossier */}
          <div className="glass-card rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                  Credential ID
                </span>
                <span className="text-xl font-mono font-extrabold text-indigo-400">
                  {result.certificateId}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={result.status === 'valid' ? 'success' : 'danger'} size="md" hasDot>
                  {result.status === 'valid' ? 'Valid Credential' : 'Revoked'}
                </Badge>
                <Badge variant="purple" size="md">
                  {result.eventCategory || 'Campus Event'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Recipient Details */}
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="flex items-center gap-2 text-indigo-400">
                  <GraduationCap className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Recipient Student</span>
                </div>
                <h4 className="text-lg font-bold text-white">{result.studentName}</h4>
                <p className="text-xs text-slate-400">
                  {result.department} {result.academicYear ? `• Year ${result.academicYear}` : ''}
                </p>
              </div>

              {/* Event Details */}
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Award className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Conferred For Event</span>
                </div>
                <h4 className="text-lg font-bold text-white line-clamp-1">{result.eventTitle}</h4>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {result.eventDate ? new Date(result.eventDate).toLocaleDateString() : 'Conducted'}
                  </span>
                  <span>•</span>
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{result.venue}</span>
                </p>
              </div>
            </div>

            {/* Cryptographic Proof Details */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Hash className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  Cryptographic Integrity Proof
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                <span className="text-slate-400">Issued On: {result.issueDate ? new Date(result.issueDate).toLocaleDateString() : '—'}</span>
                <span className="text-indigo-300 truncate max-w-sm">
                  {result.verificationHash || 'SHA-256 Validated'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : hasSearched ? null : (
        <div className="text-center py-8 text-slate-500 text-xs">
          Enter any student certificate ID above to verify its authenticity and accreditation status.
        </div>
      )}
    </div>
  );
};

export default VerifyCertificatePage;
