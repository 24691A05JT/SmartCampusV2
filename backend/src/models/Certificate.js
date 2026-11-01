import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    verificationHash: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['valid', 'revoked'],
      default: 'valid',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// One certificate per student per event
certificateSchema.index({ event: 1, student: 1 }, { unique: true });

const Certificate = mongoose.model('Certificate', certificateSchema);
export default Certificate;
