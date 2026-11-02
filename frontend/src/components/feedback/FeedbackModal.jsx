import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import StarRating from './StarRating';
import apiClient from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import { MessageSquare, Sparkles } from 'lucide-react';

export const FeedbackModal = ({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  initialFeedback = null,
  onSuccess
}) => {
  const { addToast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(initialFeedback?._id);

  useEffect(() => {
    if (initialFeedback) {
      setRating(initialFeedback.rating || 5);
      setComment(initialFeedback.comment || '');
    } else {
      setRating(5);
      setComment('');
    }
    setError('');
  }, [initialFeedback, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmed = comment.trim();
    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a star rating between 1 and 5.');
      return;
    }

    if (trimmed.length < 5) {
      setError('Please provide at least 5 characters in your feedback.');
      return;
    }

    if (trimmed.length > 1000) {
      setError('Feedback comments cannot exceed 1000 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        const res = await apiClient.put(`/feedback/${initialFeedback._id}`, {
          rating,
          comment: trimmed
        });
        addToast('Your review has been updated successfully.', 'success');
        onSuccess?.(res.data);
      } else {
        const res = await apiClient.post('/feedback', {
          eventId,
          rating,
          comment: trimmed
        });
        addToast('Thank you! Your feedback has been recorded.', 'success');
        onSuccess?.(res.data);
      }
      onClose();
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      setError(err.message || 'Unable to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Your Review' : 'Rate & Review Event'}
      description={eventTitle ? `Share your experience for "${eventTitle}"` : 'Your feedback helps improve future campus events.'}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            isLoading={submitting}
            leftIcon={isEdit ? <MessageSquare className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          >
            {isEdit ? 'Save Changes' : 'Submit Review'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* Star Rating Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Overall Rating <span className="text-rose-400">*</span>
          </label>
          <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
            <StarRating
              rating={rating}
              onChange={(newRating) => setRating(newRating)}
              size="lg"
              showLabel
            />
            <span className="text-xs text-slate-400 font-mono font-medium">
              {rating} / 5
            </span>
          </div>
        </div>

        {/* Comments Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="feedback-comment" className="text-xs font-semibold text-slate-300">
              Your Review & Comments <span className="text-rose-400">*</span>
            </label>
            <span
              className={`text-[11px] font-mono ${
                comment.length > 900
                  ? 'text-amber-400 font-bold'
                  : 'text-slate-500'
              }`}
            >
              {comment.length} / 1000
            </span>
          </div>

          <textarea
            id="feedback-comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you learn? How were the speakers, labs, and organization? Suggestions for future events..."
            className="w-full bg-slate-900/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 resize-none outline-none transition-all"
            maxLength={1000}
          />
          <p className="text-[11px] text-slate-500">
            Minimum 5 characters. Constructive and respectful feedback is appreciated.
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default FeedbackModal;
