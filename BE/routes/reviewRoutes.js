const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const {
  reviewBTC,
  reviewCTV,
  checkReviewStatus,
  updateReview,
  deleteReview,
  getUserReviews,
} = require("../controllers/reviewController");
const { protect, isCTV, isBTC } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * /api/reviews/check:
 *   get:
 *     summary: Kiểm tra trạng thái đánh giá
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: eventId
 *         required: true
 *       - in: query
 *         name: toUserId
 *         required: true
 *       - in: query
 *         name: reviewType
 *         required: true
 *     responses:
 *       200:
 *         description: Trả về trạng thái đã đánh giá hay chưa
 */
router.get("/check", protect, checkReviewStatus);

/**
 * @swagger
 * /api/reviews/btc:
 *   post:
 *     summary: CTV đánh giá BTC sau sự kiện
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - rating
 *             properties:
 *               eventId:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Đánh giá thành công
 *       400:
 *         description: Không thể đánh giá hoặc đã đánh giá trước đó
 */
// CTV reviews BTC
router.post(
  "/btc",
  protect,
  isCTV,
  [
    body("eventId").notEmpty().withMessage("Event ID is required"),
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("comment").optional().isString(),
    validate,
  ],
  reviewBTC,
);

/**
 * @swagger
 * /api/reviews/ctv:
 *   post:
 *     summary: BTC đánh giá CTV sau sự kiện
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - ctvId
 *               - skill
 *               - attitude
 *             properties:
 *               eventId:
 *                 type: string
 *               ctvId:
 *                 type: string
 *               skill:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               attitude:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Đánh giá thành công
 */
// BTC reviews CTV
router.post(
  "/ctv",
  protect,
  isBTC,
  [
    body("eventId").notEmpty().withMessage("Event ID is required"),
    body("ctvId").notEmpty().withMessage("CTV ID is required"),
    body("skill")
      .isInt({ min: 1, max: 5 })
      .withMessage("Skill rating must be between 1 and 5"),
    body("attitude")
      .isInt({ min: 1, max: 5 })
      .withMessage("Attitude rating must be between 1 and 5"),
    body("comment").optional().isString(),
    validate,
  ],
  reviewCTV,
);

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Cập nhật đánh giá
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *   delete:
 *     summary: Xóa đánh giá
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 */
router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);

/**
 * @swagger
 * /api/reviews/user/{userId}:
 *   get:
 *     summary: Xem đánh giá của người dùng (Public)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách đánh giá
 */
// Get user reviews (public)
router.get("/user/:userId", getUserReviews);

module.exports = router;
