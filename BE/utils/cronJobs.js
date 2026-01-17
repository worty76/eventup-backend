const cron = require('node-cron');
const { Event, User } = require('../models');

// Update event status based on time
const updateEventStatus = async () => {
  try {
    const now = new Date();

    // Update events that have started
    await Event.updateMany(
      {
        status: 'RECRUITING',
        startTime: { $lte: now }
      },
      {
        status: 'PREPARING'
      }
    );

    // Update events that have ended
    await Event.updateMany(
      {
        status: { $in: ['RECRUITING', 'PREPARING'] },
        endTime: { $lte: now }
      },
      {
        status: 'COMPLETED'
      }
    );

    console.log('✅ Event status updated');
  } catch (error) {
    console.error('❌ Error updating event status:', error);
  }
};

// Reset monthly subscription limits
const resetMonthlyLimits = async () => {
  try {
    const users = await User.find({
      'subscription.plan': { $in: ['FREE', 'PREMIUM'] }
    });

    for (const user of users) {
      user.resetMonthlyLimits();
      await user.save();
    }

    console.log('✅ Monthly limits reset for all users');
  } catch (error) {
    console.error('❌ Error resetting monthly limits:', error);
  }
};

// Check and downgrade expired premium subscriptions
const checkExpiredSubscriptions = async () => {
  try {
    const now = new Date();

    await User.updateMany(
      {
        'subscription.plan': 'PREMIUM',
        'subscription.expiredAt': { $lte: now }
      },
      {
        'subscription.plan': 'FREE',
        'subscription.expiredAt': null
      }
    );

    console.log('✅ Expired subscriptions downgraded');
  } catch (error) {
    console.error('❌ Error checking expired subscriptions:', error);
  }
};

// Initialize cron jobs
const initCronJobs = () => {
  // Update event status every hour
  cron.schedule('0 * * * *', () => {
    console.log('🕐 Running event status update...');
    updateEventStatus();
  });

  // Reset monthly limits on the 1st of each month at midnight
  cron.schedule('0 0 1 * *', () => {
    console.log('📅 Running monthly limits reset...');
    resetMonthlyLimits();
  });

  // Check expired subscriptions daily at midnight
  cron.schedule('0 0 * * *', () => {
    console.log('🔍 Checking expired subscriptions...');
    checkExpiredSubscriptions();
  });

  console.log('✅ Cron jobs initialized');
};

module.exports = {
  initCronJobs,
  updateEventStatus,
  resetMonthlyLimits,
  checkExpiredSubscriptions
};
