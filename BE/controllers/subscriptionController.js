const { User, Payment } = require('../models');

// Subscription plans
const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    duration: 0,
    features: {
      postLimit: parseInt(process.env.FREE_POST_LIMIT) || 5,
      urgentLimit: parseInt(process.env.FREE_URGENT_LIMIT) || 0,
      bulkApproval: false
    }
  },
  PREMIUM: {
    name: 'Premium',
    price: parseInt(process.env.PREMIUM_PRICE) || 499000,
    duration: parseInt(process.env.PREMIUM_DURATION_DAYS) || 30,
    features: {
      postLimit: parseInt(process.env.PREMIUM_POST_LIMIT) || 50,
      urgentLimit: parseInt(process.env.PREMIUM_URGENT_LIMIT) || 10,
      bulkApproval: true
    }
  }
};

// @desc    Get subscription plans
// @route   GET /api/plans
// @access  Public
exports.getPlans = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: PLANS
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current subscription
// @route   GET /api/subscriptions/current
// @access  Private
exports.getCurrentSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    const currentPlan = user.subscription.plan;
    const planDetails = PLANS[currentPlan];

    res.status(200).json({
      success: true,
      data: {
        plan: currentPlan,
        expiredAt: user.subscription.expiredAt,
        isActive: user.isPremiumActive(),
        postUsed: user.subscription.postUsed,
        urgentUsed: user.subscription.urgentUsed,
        planDetails
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upgrade to Premium
// @route   POST /api/subscriptions/upgrade
// @access  Private (BTC)
exports.upgradeToPremium = async (req, res, next) => {
  try {
    const { paymentMethod } = req.body;

    if (req.user.role !== 'BTC') {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription is only available for BTC users'
      });
    }

    // Check if already premium
    if (req.user.isPremiumActive()) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active Premium subscription'
      });
    }

    // Create payment intent/order
    // This is a simplified version - actual implementation depends on payment gateway
    const paymentData = {
      userId: req.user._id,
      amount: PLANS.PREMIUM.price,
      method: paymentMethod,
      status: 'PENDING',
      description: 'Premium Subscription Upgrade',
      subscriptionData: {
        plan: 'PREMIUM',
        duration: PLANS.PREMIUM.duration
      }
    };

    // For demo purposes, we'll create a pending payment
    const payment = await Payment.create(paymentData);

    // In production, you would redirect to payment gateway here
    // and handle the callback to activate subscription

    res.status(200).json({
      success: true,
      message: 'Payment initiated. Complete payment to activate Premium.',
      data: {
        paymentId: payment._id,
        amount: payment.amount,
        // Payment gateway URL would be here
        paymentUrl: `/api/payments/${payment._id}/process`
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel subscription
// @route   POST /api/subscriptions/cancel
// @access  Private
exports.cancelSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.subscription.plan === 'FREE') {
      return res.status(400).json({
        success: false,
        message: 'You do not have an active subscription to cancel'
      });
    }

    // Don't immediately downgrade, let it expire naturally
    // Or implement immediate cancellation based on business logic
    user.subscription.autoRenew = false; // If you have this field

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Subscription will not renew after expiration',
      data: {
        expiresAt: user.subscription.expiredAt
      }
    });
  } catch (error) {
    next(error);
  }
};
