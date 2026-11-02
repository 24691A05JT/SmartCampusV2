import { useState, useEffect, useCallback } from 'react';
import StarRating from './StarRating';
import FeedbackModal from './FeedbackModal';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Star,
  MessageSquare,
  Sparkles,
  Edit2,
  Trash2,
  Clock,
  ShieldCheck,
  Info
} from 'lucide-react';

export const EventReviewsSection = ({ event }) => {
  const { user, role } = useAuth();
  const { addToast } = useToast();

  const [feedbackList, setFeedbackList] = useState([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    breakdown: {
      5: { count: 0, percentage: 0 },
      4: { count: 0, percentage: 0 },
      3: { count: 0, percentage: 0 },
      2: { count: 0, percentage: 0 },
      1: { count: 0, percentage: 0 }
    }
  });
  const [loading, setLoading] = useState(true);

  // Eligibility state for students
  const [eligibility, setEligibility] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState(null);

  // Delete confirm dialog
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const eventId = event?._id;

  const fetchReviews = useCallback(async () => {
    if (!eventId) return;
    try {
      const res = await apiClient.get(`/feedback/event/${eventId}`);
      if (res.data) {
        setFeedbackList(res.data.feedback || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load event reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const fetchEligibility = useCallback(async () => {
    if (!eventId || !user || role !== 'student') return;
    setCheckingEligibility(true);
    try {
      const res = await apiClient.get(`/feedback/event/${eventId}/eligibility`);
      setEligibility(res.data);
    } catch (err) {
      console.error('Failed to check feedback eligibility:', err);
    } finally {
      setCheckingEligibility(false);
    }
  }, [eventId, user, role]);

  useEffect(() => {
    fetchReviews();
    fetchEligibility();
  }, [fetchReviews, fetchEligibility]);

  const handleOpenCreateModal = () => {
    setModalInitialData(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (existingFeedback) => {
    setModalInitialData(existingFeedback);
    setIsModalOpen(true);
  };

  const handleFeedbackSuccess = () => {
    fetchReviews();
    fetchEligibility();
  };

  const handleDeleteFeedback = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/feedback/${deleteTargetId}`);
      addToast('Review deleted successfully.', 'success');
      setDeleteTargetId(null);
      fetchReviews();
      fetchEligibility();
    } catch (err) {
      console.error('Failed to delete review:', err);
      addToast(err.message || 'Unable to delete review.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const myFeedback = eligibility?.feedback || feedbackList.find(
    (f) => f.student?._id === user?._id || f.student === user?._id
  );

  return (
    <section className="glass-card rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <span>Ratings & Reviews</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Verified participant evaluations and constructive student feedback.
          </p>
        </div>

        {/* Leave Feedback Action for eligible student */}
        {role === 'student' && eligibility?.eligible && !myFeedback && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateModal}
            className="shadow-md shadow-indigo-600/25"
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Leave Feedback
          </Button>
        )}
      </div>

      {/* Rating Summary & Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Overall Score Box */}
        <div className="md:col-span-5 p-6 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-2">
          <div className="text-5xl font-black text-white tracking-tight">
            {stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
          </div>
          <StarRating rating={Math.round(stats.averageRating || 0)} interactive={false} size="md" />
          <p className="text-xs text-slate-400">
            Based on <span className="text-white font-semibold">{stats.totalReviews}</span> verified {stats.totalReviews === 1 ? 'review' : 'reviews'}
          </p>
        </div>

        {/* Star Breakdown Bars */}
        <div className="md:col-span-7 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const row = stats.breakdown?.[star] || { count: 0, percentage: 0 };
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-12 text-slate-400 flex items-center gap-1 font-medium shrink-0">
                  <span>{star}</span>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                </span>

                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${row.percentage || 0}%` }}
                  />
                </div>

                <span className="w-10 text-right text-slate-400 font-mono text-[11px] shrink-0">
                  {row.count || 0}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Student Feedback Status Banners */}
      {role === 'student' && !checkingEligibility && (
        <>
          {/* User has already submitted feedback */}
          {myFeedback && (
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-300">Your Submitted Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(myFeedback)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-indigo-500/20 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    aria-label="Edit review"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(myFeedback._id)}
                    className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    aria-label="Delete review"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StarRating rating={myFeedback.rating} interactive={false} size="sm" />
                <span className="text-[11px] text-slate-400">
                  {new Date(myFeedback.submittedAt || myFeedback.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed italic">
                "{myFeedback.comment}"
              </p>
            </div>
          )}

          {/* Not eligible reasons */}
          {!eligibility?.eligible && !myFeedback && eligibility?.reason && (
            <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center gap-3 text-xs text-slate-400">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{eligibility.reason}</span>
            </div>
          )}
        </>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          All Student Reviews ({feedbackList.length})
        </h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl animate-pulse space-y-2">
                <div className="h-4 bg-slate-800 rounded w-1/4" />
                <div className="h-3 bg-slate-800 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : feedbackList.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No reviews yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Attendees will be able to share ratings and reviews once this event is concluded.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {feedbackList.map((item) => {
              const isAuthor = user && (item.student?._id === user._id || item.student === user._id);
              const isAdmin = role === 'admin';
              const canDelete = isAuthor || isAdmin;

              return (
                <div
                  key={item._id}
                  className="p-4.5 bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800/80 rounded-2xl transition-colors space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {item.student?.name ? item.student.name.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">
                          {item.student?.name || 'Verified Attendee'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {item.student?.department ? `${item.student.department}` : 'Campus Student'}
                          {item.student?.year ? ` • Year ${item.student.year}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">
                        {new Date(item.submittedAt || item.createdAt).toLocaleDateString()}
                      </span>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(item._id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                          title="Delete review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <StarRating rating={item.rating} interactive={false} size="sm" />

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.comment}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Feedback Submission / Edit Modal */}
      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventId={eventId}
        eventTitle={event?.title}
        initialFeedback={modalInitialData}
        onSuccess={handleFeedbackSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteFeedback}
        title="Delete Review?"
        message="Are you sure you want to permanently remove this review? This action cannot be undone."
        confirmText="Delete Review"
        variant="danger"
        isLoading={isDeleting}
      />
    </section>
  );
};

export default EventReviewsSection;
