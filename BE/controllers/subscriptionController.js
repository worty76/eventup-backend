const { User, Payment } = require('../models');
const crypto = require('crypto');
const https = require('https');
const qs = require('qs');

// Helper function to sort object keys for VNPay
const sortObject = (obj) => {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  keys.forEach(key => {
    sorted[key] = obj[key];
  });
  return sorted;
};

// Helper function to format date for VNPay
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

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

    if (req.user.isPremiumActive()) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active Premium subscription'
      });
    }

    // Validate payment method
    if (!['MOMO', 'VNPAY'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Please use MOMO or VNPAY.'
      });
    }

    const payment = await Payment.create({
      userId: req.user._id,
      amount: PLANS.PREMIUM.price,
      method: paymentMethod,
      status: 'PENDING',
      description: `Premium Subscription Upgrade - ${PLANS.PREMIUM.duration} days`,
      transactionId: `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      subscriptionData: {
        plan: 'PREMIUM',
        duration: PLANS.PREMIUM.duration
      }
    });

    // Handle MoMo payment
    if (paymentMethod === 'MOMO') {
      try {
        const accessKey = process.env.MOMO_ACCESS_KEY;
        const secretKey = process.env.MOMO_SECRET_KEY;
        const partnerCode = process.env.MOMO_PARTNER_CODE;
        const redirectUrl = process.env.MOMO_RETURN_URL;
        const ipnUrl = process.env.MOMO_NOTIFY_URL;
        
        const orderId = payment.transactionId;
        const requestId = orderId;
        const amount = payment.amount.toString();
        const orderInfo = payment.description;
        const extraData = JSON.stringify({
          paymentId: payment._id.toString(),
          userId: payment.userId.toString()
        });
        const requestType = 'payWithMethod';
        
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
        
        const signature = crypto
          .createHmac('sha256', secretKey)
          .update(rawSignature)
          .digest('hex');
        
        const requestBody = JSON.stringify({
          partnerCode,
          partnerName: 'Job Event Platform',
          storeId: 'JobEventStore',
          requestId,
          amount,
          orderId,
          orderInfo,
          redirectUrl,
          ipnUrl,
          lang: 'vi',
          requestType,
          autoCapture: true,
          extraData,
          orderGroupId: '',
          signature
        });
        
        // Call MoMo API
        const momoResponse = await new Promise((resolve, reject) => {
          const options = {
            hostname: 'test-payment.momo.vn',
            port: 443,
            path: '/v2/gateway/api/create',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(requestBody)
            }
          };
          
          const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
              try {
                resolve(JSON.parse(data));
              } catch (error) {
                reject(error);
              }
            });
          });
          
          req.on('error', reject);
          req.write(requestBody);
          req.end();
        });
        
        if (momoResponse.resultCode === 0) {
          payment.metadata = {
            momoRequestId: momoResponse.requestId,
            momoOrderId: momoResponse.orderId
          };
          await payment.save();
          
          return res.status(200).json({
            success: true,
            message: 'Payment created successfully. Redirecting to MoMo...',
            data: {
              paymentId: payment._id,
              amount: payment.amount,
              method: 'MOMO',
              paymentUrl: momoResponse.payUrl,
              qrCodeUrl: momoResponse.qrCodeUrl,
              deeplink: momoResponse.deeplink
            }
          });
        } else {
          payment.status = 'FAILED';
          payment.metadata = { error: momoResponse.message };
          await payment.save();
          
          return res.status(400).json({
            success: false,
            message: `MoMo payment failed: ${momoResponse.message}`
          });
        }
      } catch (momoError) {
        console.error('MoMo API Error:', momoError);
        payment.status = 'FAILED';
        await payment.save();
        
        return res.status(500).json({
          success: false,
          message: 'Failed to create MoMo payment',
          error: momoError.message
        });
      }
    }

    // Handle VNPay payment
    if (paymentMethod === 'VNPAY') {
      try {
        const vnp_TmnCode = process.env.VNPAY_TMN_CODE;
        const vnp_HashSecret = process.env.VNPAY_HASH_SECRET;
        const vnp_Url = process.env.VNPAY_URL;
        const vnp_ReturnUrl = process.env.VNPAY_RETURN_URL;
        
        const createDate = formatDate(new Date());
        const orderId = payment.transactionId;
        
        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = vnp_TmnCode;
        vnp_Params['vnp_Locale'] = 'vn';
        vnp_Params['vnp_CurrCode'] = 'VND';
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = payment.description;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = payment.amount * 100;
        vnp_Params['vnp_ReturnUrl'] = vnp_ReturnUrl;
        vnp_Params['vnp_IpAddr'] = '127.0.0.1';
        vnp_Params['vnp_CreateDate'] = createDate;
        
        // Sort params
        vnp_Params = sortObject(vnp_Params);
        
        // Create signature
        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        
        vnp_Params['vnp_SecureHash'] = signed;
        
        // Build payment URL
        const paymentUrl = vnp_Url + '?' + qs.stringify(vnp_Params, { encode: false });
        
        payment.metadata = {
          vnpayUrl: paymentUrl
        };
        await payment.save();
        
        return res.status(200).json({
          success: true,
          message: 'Payment created successfully. Redirecting to VNPay...',
          data: {
            paymentId: payment._id,
            amount: payment.amount,
            method: 'VNPAY',
            paymentUrl
          }
        });
      } catch (vnpayError) {
        console.error('VNPay Error:', vnpayError);
        payment.status = 'FAILED';
        await payment.save();
        
        return res.status(500).json({
          success: false,
          message: 'Failed to create VNPay payment',
          error: vnpayError.message
        });
      }
    }
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
