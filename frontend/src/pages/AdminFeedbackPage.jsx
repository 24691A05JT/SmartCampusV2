import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StarRating from '../components/feedback/StarRating';
import apiClient from '../services/apiClient';
import { useToast } from '../context/ToastContext';
import {
  MessageSquare,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Calendar,
  Building,
  Star
} from 'lucide-react';

export const AdminFeedbackPage = () => {
  const { addToast } = useToast();

  const [feedbackList, setFeedbackList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 15;

  // Deletion modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/feedback/admin/all?page=${page}&limit=${limit}`;
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      if (ratingFilter !== 'all') {
        url += `&rating=${ratingFilter}`;
      }

      const res = await apiClient.get(url);
      setFeedbackList(res.data || []);
      if (res.pagination) {
        setTotal(res.pagination.totalItems || 0);
      }
    } catch (err) {
      console.error('Failed to load feedback for moderation:', err);
      addToast('Unable to load campus feedback records.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, ratingFilter, addToast]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/feedback/${deleteTarget._id}`, {
        data: { reason: deleteReason.trim() || 'Violates campus community guidelines' }
      });
      addToast('Review removed and audit log generated.', 'success');
      setDeleteTarget(null);
      setDeleteReason('');
      fetchFeedback();
    } catch (err) {
      console.error('Failed to delete review:', err);
      addToast(err.message || 'Unable to delete review.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-indigo-400" />
            <span>Campus Feedback Governance</span>
            <Badge variant="primary" size="sm">
              {total} Total Reviews
            </Badge>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review, evaluate, and moderate student event submissions to maintain campus safety and standards.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="search-feedback-input"
            aria-label="Search keywords in reviews"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search keywords in reviews..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            id="rating-filter-select"
            aria-label="Filter reviews by star rating"
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setPage(1);
            }}
            className="w-full md:w-44 bg-slate-900/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
          >
            <option value="all">All Star Ratings</option>
            <option value="5">5 Stars Only</option>
            <option value="4">4 Stars Only</option>
            <option value="3">3 Stars Only</option>
            <option value="2">2 Stars Only</option>
            <option value="1">1 Star Only</option>
          </select>
        </div>
      </div>

      {/* Feedback Records List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl animate-pulse space-y-3"
              >
                <div className="h-4 bg-slate-800 rounded w-1/4" />
                <div className="h-3 bg-slate-800 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : feedbackList.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No Reviews Found"
            description="No feedback records match the current search or rating filter criteria."
          />
        ) : (
          feedbackList.map((item) => (
            <div
              key={item._id}
              className="p-5 glass-card rounded-2xl border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
                {/* Event Information */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {item.event?.category || 'Event'}
                    </span>
                    <Link
                      to={`/events/${item.event?._id}`}
                      className="text-xs font-bold text-white hover:text-indigo-400 transition-colors flex items-center gap-1"
                    >
                      <span>{item.event?.title || 'Unknown Event'}</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </Link>
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>
                      {item.event?.date ? new Date(item.event.date).toLocaleDateString() : 'N/A'}
                    </span>
                    <span>•</span>
                    <Building className="w-3 h-3 text-slate-500" />
                    <span>{item.event?.venue || 'Campus'}</span>
                  </p>
                </div>

                {/* Rating & Delete Action */}
                <div className="flex items-center gap-3">
                  <StarRating rating={item.rating} interactive={false} size="sm" />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDeleteTarget(item);
                      setDeleteReason('');
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1.5"
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Moderate
                  </Button>
                </div>
              </div>

              {/* Student & Feedback Body */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-200">
                    {item.student?.name || 'Anonymous Student'}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">
                    {item.student?.department || 'Student'}
                    {item.student?.year ? ` (Yr ${item.student.year})` : ''}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(item.submittedAt || item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/60">
                  "{item.comment}"
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Moderation Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Moderate & Remove Student Review"
        message={
          deleteTarget
            ? `Are you sure you want to delete this review by "${deleteTarget.student?.name || 'student'}" for "${deleteTarget.event?.title || 'event'}"? An immutable audit log entry will be created.`
            : ''
        }
        confirmText="Remove Review"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AdminFeedbackPage;
