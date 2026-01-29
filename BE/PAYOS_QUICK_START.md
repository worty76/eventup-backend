# PayOS Quick Start Guide

## 🚀 What's Been Added

PayOS payment gateway has been integrated into your system with the following components:

### Files Modified:
1. ✅ **paymentController.js** - Added PayOS handlers
2. ✅ **paymentRoutes.js** - Added PayOS routes
3. ✅ **.env.example** - Added PayOS configuration
4. ✅ **package.json** - Added @payos/node dependency

### New API Endpoints:
- `GET /api/payments/payos/return` - Return URL handler
- `POST /api/payments/payos/notify` - Webhook handler

## ⚙️ Configuration Steps

### 1. Get PayOS Credentials
1. Sign up at https://my.payos.vn
2. Navigate to your merchant dashboard
3. Get your credentials:
   - Client ID
   - API Key
   - Checksum Key

### 2. Update .env File
Add to your `.env` file:

```env
# PayOS Configuration
PAYOS_CLIENT_ID=your_actual_client_id
PAYOS_API_KEY=your_actual_api_key
PAYOS_CHECKSUM_KEY=your_actual_checksum_key
PAYOS_RETURN_URL=http://localhost:5000/api/payments/payos/return
PAYOS_CANCEL_URL=http://localhost:5000/api/payments/payos/return
```

### 3. Register Webhook (Production Only)
When deploying to production, register your webhook:

```javascript
const { PayOS } = require('@payos/node');

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

// Run once to register webhook
await payos.webhooks.confirm('https://yourdomain.com/api/payments/payos/notify');
```

## 💻 Usage Example

### In Your Subscription Controller

Add PayOS as a payment method option in `subscriptionController.js`:

```javascript
const { Payment } = require('../models');

// Import the helper (if needed directly, or use as shown below)
const { PayOS } = require('@payos/node');

exports.createSubscriptionPayment = async (req, res, next) => {
  try {
    const { plan, paymentMethod } = req.body; // paymentMethod: 'VNPAY', 'MOMO', or 'PAYOS'

    // Determine subscription details
    const subscriptionPlans = {
      PREMIUM: { amount: 199000, duration: 30 },
      BASIC: { amount: 99000, duration: 30 },
    };

    const selectedPlan = subscriptionPlans[plan];
    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected',
      });
    }

    // Create payment record
    const payment = await Payment.create({
      userId: req.user._id,
      transactionId: Date.now().toString(),
      amount: selectedPlan.amount,
      paymentMethod: paymentMethod,
      status: 'PENDING',
      description: `Subscription ${plan} - ${req.user.email}`,
      subscriptionData: {
        plan: plan,
        duration: selectedPlan.duration,
      },
    });

    let paymentUrl;

    // Handle PayOS payment
    if (paymentMethod === 'PAYOS') {
      const payos = new PayOS({
        clientId: process.env.PAYOS_CLIENT_ID,
        apiKey: process.env.PAYOS_API_KEY,
        checksumKey: process.env.PAYOS_CHECKSUM_KEY,
      });

      const paymentLinkData = {
        orderCode: parseInt(payment.transactionId),
        amount: payment.amount,
        description: payment.description,
        returnUrl: process.env.PAYOS_RETURN_URL,
        cancelUrl: process.env.PAYOS_CANCEL_URL,
      };

      const paymentLink = await payos.paymentRequests.create(paymentLinkData);
      paymentUrl = paymentLink.checkoutUrl;

      // Optional: return QR code for mobile payment
      return res.status(200).json({
        success: true,
        paymentUrl: paymentUrl,
        qrCode: paymentLink.qrCode,
        orderId: payment.transactionId,
      });
    }
    
    // Handle other payment methods (VNPAY, MOMO)...

  } catch (error) {
    next(error);
  }
};
```

## 🔄 Payment Flow

1. **Frontend initiates payment:**
   ```javascript
   // Example frontend code
   const response = await fetch('/api/subscriptions/payment', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`
     },
     body: JSON.stringify({
       plan: 'PREMIUM',
       paymentMethod: 'PAYOS'
     })
   });

   const { paymentUrl, qrCode } = await response.json();
   
   // Redirect to payment URL or show QR code
   window.location.href = paymentUrl;
   ```

2. **User completes payment on PayOS**
3. **User returns to your site** (redirected by PayOS)
4. **PayOS sends webhook** to update payment status
5. **Subscription activated** automatically

## 🧪 Testing

### Development Testing
For local development, use ngrok to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Start your server
npm start

# In another terminal, start ngrok
ngrok http 5000

# Use the ngrok URL for PAYOS_RETURN_URL and webhook registration
```

### Test Transaction
1. Create a payment with small amount (e.g., 1000 VND)
2. Use PayOS test credentials
3. Complete payment in sandbox mode
4. Verify webhook is received
5. Check subscription is updated

## 📊 Monitoring Payments

### Check Payment Status
```javascript
// Get all PayOS payments
const payments = await Payment.find({ paymentMethod: 'PAYOS' });

// Get specific payment
const payment = await Payment.findOne({ transactionId: 'your_order_code' });

console.log(payment.status); // PENDING, SUCCESS, or FAILED
console.log(payment.metadata.payosReference); // PayOS transaction reference
```

### Common Status Values
- `PENDING` - Payment created, waiting for completion
- `SUCCESS` - Payment completed successfully
- `FAILED` - Payment failed or declined
- `CANCELLED` - User cancelled payment

## 🐛 Troubleshooting

### Webhook Not Received
1. Check if webhook URL is publicly accessible
2. Verify HTTPS in production
3. Check webhook registration status
4. Review PayOS dashboard for webhook delivery logs

### Invalid Signature Error
1. Verify `PAYOS_CHECKSUM_KEY` is correct
2. Ensure no extra spaces in .env file
3. Check webhook payload is not modified

### Payment Not Found
1. Verify `transactionId` matches `orderCode`
2. Check if payment record was created in database
3. Ensure correct database connection

## 📚 Additional Resources

- Full Documentation: [PAYOS_INTEGRATION.md](./PAYOS_INTEGRATION.md)
- PayOS Docs: https://payos.vn/docs
- PayOS Dashboard: https://my.payos.vn
- Support: support@payos.vn

## ✅ Checklist

- [ ] Install package: `npm install @payos/node` ✓ (Already done)
- [ ] Add credentials to .env
- [ ] Test in development mode
- [ ] Register webhook URL for production
- [ ] Update subscription controller
- [ ] Update frontend payment options
- [ ] Test end-to-end flow
- [ ] Monitor webhook delivery
- [ ] Deploy to production

## 🎉 You're All Set!

The PayOS integration is complete. Just add your credentials and start accepting payments!
