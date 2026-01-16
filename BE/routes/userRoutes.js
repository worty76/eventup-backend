const express = require('express');
const {
  getMe,
  updateMe,
  getCTVCV,
  updateCTVCV,
  getBTCProfile,
  updateBTCProfile
} = require('../controllers/userController');
const { protect, isCTV, isBTC } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Lấy thông tin user hiện tại
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin user và profile
 *       401:
 *         description: Không có quyền truy cập
 */
// General user routes
router.get('/me', protect, getMe);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Cập nhật thông tin user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/me', protect, updateMe);

/**
 * @swagger
 * /api/users/ctv/cv:
 *   get:
 *     summary: Lấy CV của CTV
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin CV
 *       403:
 *         description: Chỉ CTV mới được truy cập
 */
// CTV specific routes
router.get('/ctv/cv', protect, isCTV, getCTVCV);

/**
 * @swagger
 * /api/users/ctv/cv:
 *   put:
 *     summary: Cập nhật CV của CTV
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               experiences:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/ctv/cv', protect, isCTV, updateCTVCV);

/**
 * @swagger
 * /api/users/btc/profile:
 *   get:
 *     summary: Lấy profile BTC
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin BTC
 */
// BTC specific routes
router.get('/btc/profile', protect, isBTC, getBTCProfile);

/**
 * @swagger
 * /api/users/btc/profile:
 *   put:
 *     summary: Cập nhật profile BTC
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agencyName:
 *                 type: string
 *               website:
 *                 type: string
 *               fanpage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/btc/profile', protect, isBTC, updateBTCProfile);

module.exports = router;
