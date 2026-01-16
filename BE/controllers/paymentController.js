const crypto = require('crypto');
const { Payment, User } = require('../models');

// @desc    Create payment
// @route   POST /api/payments/create
// @access  Private
exports.createPayment = async (req, res, next) => {
  try {
    const { amount, method, description } = req.body;

    const payment = await Payment.create({
      userId: req.user._id,
      amount,
      method,
      status: 'PENDING',
      description,
      transactionId: `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
    });

    // In production, integrate with actual payment gateways
    // For now, return payment details
    res.status(201).json({
      success: true,
      data: payment,
      paymentUrl: `/api/payments/${payment._id}/process`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process payment (simulate)
// @route   POST /api/payments/:id/process
// @access  Private
exports.processPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (payment.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Payment already processed'
      });
    }

    // Simulate successful payment
    payment.status = 'SUCCESS';
    await payment.save();

    // If this is a subscription payment, activate it
    if (payment.subscriptionData && payment.subscriptionData.plan) {
      const user = await User.findById(payment.userId);
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + payment.subscriptionData.duration);

      user.subscription.plan = payment.subscriptionData.plan;
      user.subscription.expiredAt = expiryDate;
      user.subscription.urgentUsed = 0;
      user.subscription.postUsed = 0;
      
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's payment history
// @route   GET /api/payments
// @access  Private
exports.getPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { userId: req.user._id };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Payment webhook (for payment gateways)
// @route   POST /api/payments/webhook
// @access  Public (but should verify signature)
exports.paymentWebhook = async (req, res, next) => {
  try {
    // This is where you'd handle webhooks from VNPay, Momo, Stripe, etc.
    // Verify signature, update payment status, etc.
    
    const { transactionId, status, signature } = req.body;

    // Verify webhook signature here
    // ...

    // Find and update payment
    const payment = await Payment.findOne({ transactionId });
    
    if (payment) {
      payment.status = status;
      await payment.save();

      // Handle subscription activation if needed
      if (status === 'SUCCESS' && payment.subscriptionData) {
        const user = await User.findById(payment.userId);
        
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + payment.subscriptionData.duration);

        user.subscription.plan = payment.subscriptionData.plan;
        user.subscription.expiredAt = expiryDate;
        
        await user.save();
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// @desc    VNPay return URL handler
// @route   GET /api/payments/vnpay/return
// @access  Public
exports.vnpayReturn = async (req, res, next) => {
  try {
    // Handle VNPay return parameters
    // Verify signature and update payment status
    
    res.redirect('/payment-success'); // Redirect to frontend
  } catch (error) {
    res.redirect('/payment-failed');
  }
};

// @desc    Momo callback
// @route   POST /api/payments/momo/notify
// @access  Public
exports.momoNotify = async (req, res, next) => {
  try {
    // Handle Momo IPN notification
    
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
