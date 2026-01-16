const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const {
  registerCTV,
  registerBTC,
  sendOTP,
  verifyOTP,
  login,
  refreshToken,
  googleLogin,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register/ctv:
 *   post:
 *     summary: Đăng ký tài khoản CTV (Cộng tác viên)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *               - phone
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ctv@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *               fullName:
 *                 type: string
 *                 example: Nguyễn Văn A
 *               phone:
 *                 type: string
 *                 example: "0901234567"
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *                 example: MALE
 *               address:
 *                 type: string
 *                 example: Hà Nội
 *     responses:
 *       201:
 *         description: Đăng ký thành công. OTP đã được gửi qua email
 *       400:
 *         description: Email đã tồn tại hoặc dữ liệu không hợp lệ
 */
// Register routes
router.post('/register/ctv', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  validate
], registerCTV);

/**
 * @swagger
 * /api/auth/register/btc:
 *   post:
 *     summary: Đăng ký tài khoản BTC (Ban tổ chức)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - agencyName
 *               - phone
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: btc@company.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *               agencyName:
 *                 type: string
 *                 example: ABC Events Company
 *               phone:
 *                 type: string
 *                 example: "0909999999"
 *               address:
 *                 type: string
 *                 example: Hồ Chí Minh
 *               logoUrl:
 *                 type: string
 *                 example: https://example.com/logo.png
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Email đã tồn tại
 */
router.post('/register/btc', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('agencyName').notEmpty().withMessage('Agency name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  validate
], registerBTC);

/**
 * @swagger
 * /api/auth/send-otp:
 *   post:
 *     summary: Gửi mã OTP xác thực
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP đã được gửi
 *       404:
 *         description: User không tồn tại
 */
// OTP routes
router.post('/send-otp', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  validate
], sendOTP);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Xác thực mã OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Xác thực thành công, trả về token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: OTP không hợp lệ hoặc đã hết hạn
 */
router.post('/verify-otp', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  validate
], verifyOTP);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [CTV, BTC]
 *                 example: CTV
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Email hoặc mật khẩu không đúng
 *       403:
 *         description: Tài khoản bị khóa hoặc chưa xác thực
 */
// Login routes
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
], login);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Làm mới access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token mới
 *       401:
 *         description: Refresh token không hợp lệ
 */
// Token routes
router.post('/refresh-token', refreshToken);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Đăng nhập với Google
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       501:
 *         description: Chức năng chưa được triển khai
 */
// Google OAuth
router.post('/google', googleLogin);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *       401:
 *         description: Không có quyền truy cập
 */
// Logout
router.post('/logout', protect, logout);

module.exports = router;
