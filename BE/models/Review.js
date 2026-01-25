const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event ID is required']
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reviewer ID is required']
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reviewee ID is required']
  },
  reviewType: {
    type: String,
    enum: ['BTC_TO_CTV', 'CTV_TO_BTC'],
    required: true
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  skill: {
    type: Number,
    min: [1, 'Skill rating must be at least 1'],
    max: [5, 'Skill rating cannot exceed 5']
  },
  attitude: {
    type: Number,
    min: [1, 'Attitude rating must be at least 1'],
    max: [5, 'Attitude rating cannot exceed 5']
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

reviewSchema.index({ eventId: 1, fromUser: 1, toUser: 1 }, { unique: true });

reviewSchema.index({ toUser: 1, reviewType: 1 });
reviewSchema.index({ fromUser: 1 });
reviewSchema.index({ eventId: 1 });

reviewSchema.pre('save', function(next) {
  if (this.reviewType === 'CTV_TO_BTC' && !this.rating) {
    return next(new Error('Rating is required for BTC review'));
  }
  
  if (this.reviewType === 'BTC_TO_CTV' && (!this.skill || !this.attitude)) {
    return next(new Error('Skill and attitude ratings are required for CTV review'));
  }
  
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
