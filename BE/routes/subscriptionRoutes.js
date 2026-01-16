const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const {
  getPlans,
  getCurrentSubscription,
  upgradeToPremium,
  cancelSubscription
} = require('../controllers/subscriptionController');
const { protect, isBTC } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/subscriptions/plans:
 *   get:
 *     summary: Lấy danh sách các gói Premium (Public)
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         description: Danh sách gói Premium
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   price:
 *                     type: number
 *                   features:
 *                     type: array
 *                     items:
 *                       type: string
 */
// Public routes
router.get('/plans', getPlans);

/**
 * @swagger
 * /api/subscriptions/current:
 *   get:
 *     summary: Xem gói hiện tại của user
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin gói hiện tại
 */
// Protected routes
router.get('/current', protect, getCurrentSubscription);

/**
 * @swagger
 * /api/subscriptions/upgrade:
 *   post:
 *     summary: Nâng cấp lên Premium (BTC)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethod
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [MOMO, VNPAY, STRIPE]
 *     responses:
 *       200:
 *         description: Tạo link thanh toán thành công
 */
router.post('/upgrade', protect, isBTC, [
  body('paymentMethod').isIn(['MOMO', 'VNPAY', 'STRIPE']).withMessage('Invalid payment method'),
  validate
], upgradeToPremium);

/**
 * @swagger
 * /api/subscriptions/cancel:
 *   post:
 *     summary: Hủy gói Premium
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hủy gói thành công
 */
router.post('/cancel', protect, cancelSubscription);

module.exports = router;
