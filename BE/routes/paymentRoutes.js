const express = require('express');
const {
  createPayment,
  processPayment,
  getPayments,
  paymentWebhook,
  vnpayReturn,
  momoNotify
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/payments/create:
 *   post:
 *     summary: Tạo payment mới
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentMethod
 *               - subscriptionType
 *             properties:
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [MOMO, VNPAY, STRIPE]
 *               subscriptionType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo payment thành công
 */
// Protected routes
router.post('/create', protect, createPayment);

/**
 * @swagger
 * /api/payments/{id}/process:
 *   post:
 *     summary: Xử lý thanh toán
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xử lý thành công
 */
router.post('/:id/process', protect, processPayment);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Lấy lịch sử thanh toán
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, refunded]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách thanh toán
 */
router.get('/', protect, getPayments);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Webhook từ payment gateway (Public)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Webhook processed
 */
// Public webhook routes (should verify signatures in production)
router.post('/webhook', paymentWebhook);

/**
 * @swagger
 * /api/payments/vnpay/return:
 *   get:
 *     summary: Callback từ VNPay (Public)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: VNPay return processed
 */
router.get('/vnpay/return', vnpayReturn);

/**
 * @swagger
 * /api/payments/momo/notify:
 *   post:
 *     summary: Notification từ MoMo (Public)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: MoMo notification processed
 */
router.post('/momo/notify', momoNotify);

module.exports = router;
