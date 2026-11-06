import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Calendar, MapPin, Users, Sparkles } from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../services/apiClient';

const CATEGORIES = [
  'Technical',
  'Workshop',
  'Cultural',
  'Sports',
  'Seminar',
  'Hackathon',
  'Webinar',
  'Career'
];

const DEPARTMENTS = [
  'All',
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Electrical & Electronics',
  'Mechanical Engineering',
  'Civil Engineering',
  'Biotechnology',
  'Business Administration',
  'Humanities & Sciences'
];

const PRESET_VENUES = [
  'Main Auditorium (Capacity: 800)',
  'Mini Auditorium (Capacity: 250)',
  'Tech Hub Seminar Hall A (Capacity: 150)',
  'Tech Hub Seminar Hall B (Capacity: 150)',
  'Central Computer Lab 1 (Capacity: 80)',
  'Central Computer Lab 2 (Capacity: 80)',
  'Open Air Amphitheatre (Capacity: 500)',
  'Sports Complex Arena (Capacity: 600)',
  'Mechanical Workshop Hall (Capacity: 120)',
  'Library Conference Room (Capacity: 60)',
  'Other / Custom Venue'
];

export const EventFormModal = ({ isOpen, onClose, event = null, onSuccess }) => {
  const toast = useToast();
  const addToast = (msg, type = 'info') => {
    if (typeof toast?.addToast === 'function') toast.addToast(msg, type);
    else if (typeof toast?.[type] === 'function') toast[type](msg);
    else if (typeof toast?.showToast === 'function') toast.showToast({ type, message: msg });
  };
  const isEditing = !!event;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Technical',
    tags: '',
    targetDepartment: 'All',
    targetYear: [1, 2, 3, 4],
    date: '',
    startTime: '10:00',
    endTime: '12:00',
    venue: PRESET_VENUES[0],
    customVenue: '',
    capacity: 100,
    registrationDeadline: '',
    bannerImage: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [conflictState, setConflictState] = useState({
    checked: false,
    hasConflict: false,
    message: '',
    conflictingEvent: null,
    isChecking: false
  });

  // Populate form if editing
  useEffect(() => {
    if (event) {
      const isPreset = PRESET_VENUES.some((v) => v === event.venue);
      setFormData({
        title: event.title || '',
        description: event.description || '',
        category: event.category || 'Technical',
        tags: Array.isArray(event.tags) ? event.tags.join(', ') : '',
        targetDepartment: event.targetDepartment || 'All',
        targetYear: event.targetYear || [1, 2, 3, 4],
        date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
        startTime: event.startTime || '10:00',
        endTime: event.endTime || '12:00',
        venue: isPreset ? event.venue : 'Other / Custom Venue',
        customVenue: isPreset ? '' : event.venue,
        capacity: event.capacity || 100,
        registrationDeadline: event.registrationDeadline
          ? new Date(event.registrationDeadline).toISOString().split('T')[0]
          : '',
        bannerImage: event.bannerImage || ''
      });
      setConflictState({
        checked: false,
        hasConflict: false,
        message: '',
        conflictingEvent: null,
        isChecking: false
      });
    } else {
      // Default to 7 days from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      const dateStr = defaultDate.toISOString().split('T')[0];

      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + 5);
      const deadlineStr = deadlineDate.toISOString().split('T')[0];

      setFormData({
        title: '',
        description: '',
        category: 'Technical',
        tags: '',
        targetDepartment: 'All',
        targetYear: [1, 2, 3, 4],
        date: dateStr,
        startTime: '10:00',
        endTime: '12:00',
        venue: PRESET_VENUES[0],
        customVenue: '',
        capacity: 100,
        registrationDeadline: deadlineStr,
        bannerImage: ''
      });
      setConflictState({
        checked: false,
        hasConflict: false,
        message: '',
        conflictingEvent: null,
        isChecking: false
      });
    }
    setErrors({});
  }, [event, isOpen]);

  const resolvedVenue =
    formData.venue === 'Other / Custom Venue'
      ? formData.customVenue.trim()
      : formData.venue;

  // Real-time conflict checking
  const checkConflict = async () => {
    if (!formData.date || !formData.startTime || !formData.endTime || !resolvedVenue) {
      return;
    }

    setConflictState((prev) => ({ ...prev, isChecking: true }));
    try {
      const res = await apiClient.post('/events/check-conflict', {
        venue: resolvedVenue,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        excludeEventId: event?._id
      });

      // Defensive conflict normalization:
      // Backend returns sendSuccess(res, result.message, result) where result is { hasConflict, conflictingEvent, message }
      // apiClient interceptor unwraps response.data: { success, message, data: { hasConflict, conflictingEvent, message } }
      const conflictData = res?.data?.hasConflict !== undefined
        ? res.data
        : (res?.hasConflict !== undefined ? res : (res?.data || {}));

      const hasConflict = Boolean(conflictData?.hasConflict);
      const message = conflictData?.message || res?.message || (hasConflict ? 'Schedule conflict detected.' : 'Venue is available.');
      const conflictingEvent = conflictData?.conflictingEvent || null;

      setConflictState({
        checked: true,
        hasConflict,
        message,
        conflictingEvent,
        isChecking: false
      });
    } catch (err) {
      const errorMsg = err.message || err.data?.message || err.response?.data?.message || 'Could not verify venue availability.';
      setConflictState((prev) => ({
        ...prev,
        checked: true,
        hasConflict: false,
        message: errorMsg,
        isChecking: false
      }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Event title is required.';
    if (!formData.description.trim()) errs.description = 'Event description is required.';
    if (!formData.date) errs.date = 'Event date is required.';
    if (!formData.startTime) errs.startTime = 'Start time is required.';
    if (!formData.endTime) errs.endTime = 'End time is required.';
    if (!resolvedVenue) errs.venue = 'Venue is required.';

    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      errs.endTime = 'End time must be after start time.';
    }

    if (!formData.capacity || Number(formData.capacity) < 1) {
      errs.capacity = 'Capacity must be at least 1.';
    }

    if (!formData.registrationDeadline) {
      errs.registrationDeadline = 'Registration deadline is required.';
    } else if (formData.date && formData.registrationDeadline > formData.date) {
      errs.registrationDeadline = 'Deadline cannot be after the event date.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (submitStatus = 'draft') => {
    if (!validate()) {
      addToast('Please correct the validation errors in the form.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        targetDepartment: formData.targetDepartment,
        targetYear: formData.targetYear,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        venue: resolvedVenue,
        capacity: Number(formData.capacity),
        registrationDeadline: formData.registrationDeadline,
        bannerImage: formData.bannerImage.trim(),
        status: submitStatus
      };

      let response;
      if (isEditing) {
        response = await apiClient.put(`/events/${event._id}`, payload);
        addToast(
          submitStatus === 'pending'
            ? 'Event updated and submitted for approval!'
            : 'Event updated successfully!',
          'success'
        );
      } else {
        response = await apiClient.post('/events', payload);
        addToast(
          submitStatus === 'pending'
            ? 'Event created and submitted for administrative approval!'
            : 'Event draft saved successfully!',
          'success'
        );
      }

      // Extract saved event defensively
      const savedEvent = response?.data?.title
        ? response.data
        : (response?.title ? response : (response?.data?.data || response?.data));

      onSuccess?.(savedEvent);
      onClose();
    } catch (err) {
      const msg = err.data?.message || err.response?.data?.message || err.message || 'Failed to save event.';
      addToast(msg, 'error');
      const conflictPayload =
        err.data?.errors?.conflict ||
        err.data?.conflict ||
        err.response?.data?.data?.conflict ||
        err.response?.data?.errors?.conflict;
      if (conflictPayload) {
        setConflictState({
          checked: true,
          hasConflict: true,
          message: conflictPayload.message || 'Schedule conflict detected at this venue.',
          conflictingEvent: conflictPayload.conflictingEvent || null,
          isChecking: false
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleYearToggle = (yr) => {
    setFormData((prev) => {
      const current = prev.targetYear || [];
      if (current.includes(yr)) {
        return { ...prev, targetYear: current.filter((y) => y !== yr) };
      } else {
        return { ...prev, targetYear: [...current, yr].sort() };
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={isEditing ? 'Edit Event Details' : 'Create New Campus Event'}
      description="Fill in all event details. Drafts can be saved privately, or submit for admin review when ready."
    >
      <div className="space-y-6">
        {/* Title & Category */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Event Title"
              id="event-title"
              required
              placeholder="e.g. Annual Tech Symposium & Hackathon 2026"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              error={errors.title}
            />
          </div>
          <div>
            <Select
              label="Category"
              id="event-category"
              required
              options={CATEGORIES}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5 text-left">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            placeholder="Provide a comprehensive description of the event agenda, speaker details, and student takeaways..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={`w-full px-4 py-3 bg-slate-900/90 text-slate-100 text-sm rounded-xl border appearance-none outline-none transition-all ${
              errors.description
                ? 'border-rose-500/80 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                : 'border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
            }`}
          />
          {errors.description && (
            <p className="text-xs text-rose-400 font-medium">{errors.description}</p>
          )}
        </div>

        {/* Date & Timings */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Date, Timing & Venue Schedule</span>
            </h4>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={checkConflict}
              isLoading={conflictState.isChecking}
              className="text-xs"
            >
              Verify Venue Slot
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              type="date"
              label="Event Date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              error={errors.date}
            />
            <Input
              type="time"
              label="Start Time"
              required
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              error={errors.startTime}
            />
            <Input
              type="time"
              label="End Time"
              required
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              error={errors.endTime}
            />
          </div>

          {/* Venue Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Campus Venue"
              id="event-venue"
              required
              options={PRESET_VENUES}
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              error={errors.venue}
            />
            {formData.venue === 'Other / Custom Venue' && (
              <Input
                label="Custom Venue Name"
                id="event-custom-venue"
                required
                placeholder="e.g. Block B Seminar Room 302"
                value={formData.customVenue}
                onChange={(e) => setFormData({ ...formData, customVenue: e.target.value })}
                error={errors.venue}
              />
            )}
          </div>

          {/* Venue Conflict Warning Banner */}
          {conflictState.checked && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 transition-all ${
                conflictState.hasConflict
                  ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                  : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
              }`}
            >
              {conflictState.hasConflict ? (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-semibold">
                  {conflictState.hasConflict
                    ? 'Schedule Conflict Detected at this Venue!'
                    : 'Venue is Available for this Timeslot!'}
                </p>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  {conflictState.message}
                </p>
                {conflictState.conflictingEvent && (
                  <p className="text-[11px] text-amber-300 font-medium">
                    Conflicting Event: &quot;{conflictState.conflictingEvent.title}&quot; (
                    {conflictState.conflictingEvent.startTime} –{' '}
                    {conflictState.conflictingEvent.endTime})
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Capacity & Deadline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="number"
            min="1"
            label="Total Seat Capacity"
            required
            helperText="Maximum allowed attendees"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            error={errors.capacity}
          />
          <Input
            type="date"
            label="Registration Deadline"
            required
            helperText="Must be on or before the event date"
            value={formData.registrationDeadline}
            onChange={(e) =>
              setFormData({ ...formData, registrationDeadline: e.target.value })
            }
            error={errors.registrationDeadline}
          />
        </div>

        {/* Targeting & Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Target Department"
            options={DEPARTMENTS}
            value={formData.targetDepartment}
            onChange={(e) =>
              setFormData({ ...formData, targetDepartment: e.target.value })
            }
          />
          <Input
            label="Tags / Skills (comma separated)"
            placeholder="AI, Machine Learning, Python, Robotics"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            helperText="Used by the AI recommendation engine"
          />
        </div>

        {/* Target Years */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Target Academic Years
          </label>
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4].map((yr) => {
              const selected = formData.targetYear.includes(yr);
              return (
                <button
                  key={yr}
                  type="button"
                  onClick={() => handleYearToggle(yr)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    selected
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-600/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  Year {yr}
                </button>
              );
            })}
          </div>
        </div>

        {/* Banner Image URL */}
        <Input
          label="Banner Image URL (Optional)"
          placeholder="https://images.unsplash.com/..."
          value={formData.bannerImage}
          onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
        />

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="neutral"
            onClick={() => handleSubmit('draft')}
            isLoading={submitting}
          >
            Save as Draft
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={() => handleSubmit('pending')}
            isLoading={submitting}
          >
            {isEditing ? 'Save & Submit for Review' : 'Submit for Review'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EventFormModal;
