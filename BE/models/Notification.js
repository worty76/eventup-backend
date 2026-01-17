const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  type: {
    type: String,
    enum: ['APPLICATION', 'APPROVAL', 'REJECTION', 'REMINDER', 'REVIEW', 'PAYMENT', 'SYSTEM'],
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  relatedModel: {
    type: String,
    enum: ['Event', 'Application', 'Payment', 'Review', null],
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  return await this.create(data);
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
