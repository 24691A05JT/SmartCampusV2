import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an event title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
      index: true
    },
    description: {
      type: String,
      required: [true, 'Please provide an event description'],
      trim: true
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    category: {
      type: String,
      required: [true, 'Please specify an event category'],
      enum: {
        values: [
          'Technical',
          'Workshop',
          'Cultural',
          'Sports',
          'Seminar',
          'Hackathon',
          'Webinar',
          'Career'
        ],
        message: '{VALUE} is not a valid event category'
      },
      index: true
    },
    tags: {
      type: [String],
      default: [],
      index: true
    },
    targetDepartment: {
      type: String,
      default: 'All',
      trim: true
    },
    targetYear: {
      type: [Number],
      default: [] // Empty means all academic years
    },
    date: {
      type: Date,
      required: [true, 'Please provide an event date'],
      index: true
    },
    startTime: {
      type: String,
      required: [true, 'Please provide a start time (HH:mm)'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in 24-hour HH:mm format']
    },
    endTime: {
      type: String,
      required: [true, 'Please provide an end time (HH:mm)'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in 24-hour HH:mm format']
    },
    venue: {
      type: String,
      required: [true, 'Please specify an event venue'],
      trim: true,
      index: true
    },
    capacity: {
      type: Number,
      required: [true, 'Please specify event seating capacity'],
      min: [1, 'Capacity must be at least 1']
    },
    registeredCount: {
      type: Number,
      default: 0,
      min: 0
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Please provide a registration deadline']
    },
    bannerImage: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected'],
      default: 'draft',
      index: true
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    isCancelled: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Compound index for instant venue & schedule conflict queries
eventSchema.index({ venue: 1, date: 1, status: 1 });

const Event = mongoose.model('Event', eventSchema);
export default Event;
