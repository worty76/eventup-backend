# PayOS Payment Gateway Integration

## Overview
PayOS has been successfully integrated into the payment system alongside VNPay and MoMo. This document provides configuration and usage information.

## Prerequisites
- PayOS merchant account
- Client ID, API Key, and Checksum Key from PayOS dashboard

## Environment Variables
Add the following environment variables to your `.env` file:

```env
# PayOS Configuration
PAYOS_CLIENT_ID=your_client_id_here
PAYOS_API_KEY=your_api_key_here
PAYOS_CHECKSUM_KEY=your_checksum_key_here
PAYOS_RETURN_URL=http://localhost:5000/api/payments/payos/return
PAYOS_CANCEL_URL=http://localhost:5000/api/payments/payos/return
```

### Production Configuration
For production, update the URLs:
```env
PAYOS_RETURN_URL=https://your-domain.com/api/payments/payos/return
PAYOS_CANCEL_URL=https://your-domain.com/api/payments/payos/return
```

## API Endpoints

### 1. Create Payment (to be implemented in subscription controller)
```javascript
// Example usage in subscriptionController.js
const { createPayOSPayment } = require('./paymentController');

// Create payment record
const payment = await Payment.create({
  userId: req.user._id,
  transactionId: Date.now().toString(), // Must be unique number
  amount: subscriptionAmount,
  paymentMethod: 'PAYOS',
  status: 'PENDING',
  description: `Subscription payment - ${planName}`,
  subscriptionData: {
    plan: planName,
    duration: durationDays,
  },
});

// Create PayOS payment link
const paymentLink = await createPayOSPayment(payment);

// Return payment URL to client
res.json({
  success: true,
  paymentUrl: paymentLink.checkoutUrl,
  qrCode: paymentLink.qrCode, // Optional: for QR code payment
});
```

### 2. Return URL Handler
**Endpoint:** `GET /api/payments/payos/return`

**Query Parameters:**
- `orderCode`: Transaction ID
- `status`: Payment status (PAID, PENDING, CANCELLED)
- `cancel`: Boolean indicating if user cancelled

**Behavior:**
- Redirects to frontend with appropriate status
- Actual payment confirmation happens via webhook

### 3. Webhook Handler
**Endpoint:** `POST /api/payments/payos/notify`

**Request Body:** PayOS webhook data with signature

**Behavior:**
- Verifies webhook signature
- Updates payment status
- Updates user subscription if payment successful
- Returns success/failure response to PayOS

## Webhook Configuration

### Register Webhook URL
You need to register your webhook URL with PayOS:

```javascript
const { PayOS } = require('@payos/node');

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

// Register webhook (run once)
await payos.webhooks.confirm('https://your-domain.com/api/payments/payos/notify');
```

### Webhook URL Requirements
- Must be publicly accessible (HTTPS required for production)
- Must return 200 status code within 5 seconds
- Signature verification is automatic using checksumKey

## Payment Flow

1. **User initiates payment**
   - Frontend calls your subscription endpoint
   - Backend creates Payment record with PENDING status
   - Backend calls `createPayOSPayment()` to get payment URL
   - Return payment URL to frontend

2. **User completes payment on PayOS**
   - User is redirected to PayOS payment page
   - User selects payment method (QR, bank transfer, etc.)
   - User completes payment

3. **User returns to your site**
   - PayOS redirects to `PAYOS_RETURN_URL`
   - Controller redirects to frontend with status
   - Frontend shows pending/success message

4. **PayOS sends webhook**
   - PayOS sends POST request to webhook URL
   - Controller verifies signature
   - Controller updates payment status
   - Controller updates user subscription if successful

## Payment Status Lifecycle

```
PENDING (initial) → SUCCESS (webhook confirms) → User subscription updated
                 ↘ FAILED (payment declined)
                 ↘ CANCELLED (user cancelled)
```

## Error Handling

### Common Error Scenarios

1. **Invalid Signature**
   - Returns 400 Bad Request
   - Logs error: "PayOS Notify: Invalid webhook signature"

2. **Payment Not Found**
   - Returns 404 Not Found
   - Logs error: "PayOS Notify: Payment not found"

3. **Already Processed**
   - Returns 200 OK with "Payment already processed"
   - Prevents duplicate subscription updates

4. **PayOS API Error**
   - Caught in createPayOSPayment
   - Logs error details
   - Throws error to be handled by caller

## Testing

### Local Testing with ngrok
For webhook testing in development:

1. Install ngrok: `npm install -g ngrok`
2. Start ngrok: `ngrok http 5000`
3. Update webhook URL with ngrok URL
4. Register webhook: `https://your-ngrok-url.ngrok.io/api/payments/payos/notify`

### Test Payment
Use PayOS sandbox/test environment credentials for testing without real money.

## Security Considerations

1. **Signature Verification**
   - All webhooks are verified using HMAC SHA-256
   - Invalid signatures are rejected

2. **Idempotency**
   - Payment status is checked before processing
   - Prevents duplicate subscription updates

3. **Environment Variables**
   - Never commit credentials to git
   - Use different credentials for dev/prod

4. **HTTPS Required**
   - Production webhooks must use HTTPS
   - PayOS may reject HTTP webhooks

## Integration with Subscription System

The PayOS integration works seamlessly with your existing subscription system:

- Updates `user.subscription.plan`
- Sets `user.subscription.expiredAt`
- Resets `user.subscription.urgentUsed` and `postUsed`
- Stores payment metadata for auditing

## Monitoring

### Important Logs
- Creation: "PayOS Payment Creation Error"
- Return: "PayOS Return: Payment not found"
- Webhook: "PayOS Notify: Invalid webhook signature"
- Webhook: "PayOS Notify: Payment not found"

### Recommended Monitoring
1. Track webhook delivery success rate
2. Monitor payment status distribution
3. Alert on high failure rates
4. Track signature verification failures

## Additional Features

### QR Code Payment
PayOS returns a QR code URL that can be displayed to users for quick payment via mobile banking apps.

### Payment Information
Access detailed payment info:
```javascript
const payment = await Payment.findOne({ transactionId: orderCode });
console.log(payment.metadata.payosReference); // PayOS transaction reference
```

## Support
- PayOS Documentation: https://payos.vn/docs
- PayOS Dashboard: https://my.payos.vn
- API Reference: https://payos.vn/docs/api

## Next Steps

1. **Configure Environment Variables**
   - Add PayOS credentials to `.env`

2. **Update Subscription Controller**
   - Import and use `createPayOSPayment` function
   - Add PayOS as payment method option

3. **Register Webhook**
   - Run webhook registration code once
   - Verify webhook URL is accessible

4. **Test Integration**
   - Create test payment
   - Complete payment on PayOS
   - Verify webhook updates subscription

5. **Update Frontend**
   - Add PayOS payment option
   - Handle payment redirects
   - Display QR code if needed
