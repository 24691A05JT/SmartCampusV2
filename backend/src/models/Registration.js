import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema(
  {
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
    registrationDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
      index: true
    },
    ticketCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    cancelledAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate registration for the same event by the same student
registrationSchema.index({ event: 1, student: 1 }, { unique: true });

const Registration = mongoose.model('Registration', registrationSchema);
export default Registration;
