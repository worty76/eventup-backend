const express = require('express');
const {
  getPayments,
  vnpayReturn,
  momoReturn,
  momoNotify
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

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
 * /api/payments/momo/return:
 *   get:
 *     summary: Return URL từ MoMo (Public)
 *     tags: [Payments]
 *     responses:
 *       302:
 *         description: Redirect to frontend
 */
router.get('/momo/return', momoReturn);

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
