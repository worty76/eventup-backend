const express = require("express");
const {
  getMe,
  updateMe,
  getCTVCV,
  updateCTVCV,
  getBTCProfile,
  updateBTCProfile,
  getPublicBTCProfile,
  getPublicCTVProfile,
} = require("../controllers/userController");
const { protect, isCTV, isBTC } = require("../middleware/auth");

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
router.get("/me", protect, getMe);

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
router.put("/me", protect, updateMe);

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
router.get("/ctv/cv", protect, isCTV, getCTVCV);

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
 *                 description: Họ và tên
 *               avatar:
 *                 type: string
 *                 description: URL ảnh đại diện
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *                 description: Giới tính
 *               address:
 *                 type: string
 *                 description: Địa chỉ
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Danh sách kỹ năng
 *               experiences:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Kinh nghiệm làm việc
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/ctv/cv", protect, isCTV, updateCTVCV);

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
router.get("/btc/profile", protect, isBTC, getBTCProfile);

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
 *                 description: Tên công ty/tổ chức
 *               logo:
 *                 type: string
 *                 description: URL logo công ty
 *               address:
 *                 type: string
 *                 description: Địa chỉ công ty
 *               website:
 *                 type: string
 *                 description: Website công ty
 *               fanpage:
 *                 type: string
 *                 description: Facebook fanpage
 *               description:
 *                 type: string
 *                 description: Mô tả về công ty
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/btc/profile", protect, isBTC, updateBTCProfile);

/**
 * @swagger
 * /api/users/btc/{id}/public:
 *   get:
 *     summary: Lấy profile công khai của BTC
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin BTC công khai
 *       404:
 *         description: Không tìm thấy hồ sơ
 */
router.get("/btc/:id/public", getPublicBTCProfile);

/**
 * @swagger
 * /api/users/ctv/{id}/public:
 *   get:
 *     summary: Lấy profile công khai của CTV
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin CTV công khai
 *       404:
 *         description: Không tìm thấy hồ sơ
 */
router.get("/ctv/:id/public", getPublicCTVProfile);

module.exports = router;
