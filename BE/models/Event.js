const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  btcId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'BTC ID is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  eventType: {
    type: String,
    enum: ['Concert', 'Workshop', 'Festival', 'Conference', 'Sports', 'Exhibition', 'Other'],
    required: [true, 'Event type is required']
  },
  salary: {
    type: String,
    required: [true, 'Salary is required'],
    trim: true
  },
  benefits: {
    type: String,
    trim: true
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  deadline: {
    type: Date,
    required: [true, 'Application deadline is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  appliedCount: {
    type: Number,
    default: 0
  },
  poster: {
    type: String,
    default: null
  },
  urgent: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['PREPARING', 'RECRUITING', 'COMPLETED', 'CANCELLED'],
    default: 'PREPARING'
  },
  views: {
    type: Number,
    default: 0
  },
  requirements: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Validate that endTime is after startTime
eventSchema.pre('save', function(next) {
  if (this.endTime <= this.startTime) {
    next(new Error('End time must be after start time'));
  }
  if (this.deadline >= this.startTime) {
    next(new Error('Deadline must be before start time'));
  }
  next();
});

// Indexes for better query performance
eventSchema.index({ btcId: 1 });
eventSchema.index({ status: 1, deadline: -1 });
eventSchema.index({ location: 1 });
eventSchema.index({ eventType: 1 });
eventSchema.index({ urgent: 1, createdAt: -1 });
eventSchema.index({ title: 'text', description: 'text' });

// Method to check if event can receive applications
eventSchema.methods.canApply = function() {
  return this.status === 'RECRUITING' && 
         new Date() < this.deadline && 
         this.appliedCount < this.quantity;
};

// Method to increment views
eventSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
