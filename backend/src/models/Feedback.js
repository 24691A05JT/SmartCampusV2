import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5'],
      min: [1, 'Minimum rating is 1'],
      max: [5, 'Maximum rating is 5']
    },
    comment: {
      type: String,
      required: [true, 'Please provide feedback comments'],
      trim: true,
      maxlength: [1000, 'Comments cannot exceed 1000 characters']
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// One feedback per student per event
feedbackSchema.index({ event: 1, student: 1 }, { unique: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
