const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents
} = require('../controllers/eventController');
const { protect, isBTC, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Lấy danh sách sự kiện (Public)
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Địa điểm
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Loại sự kiện
 *       - in: query
 *         name: urgent
 *         schema:
 *           type: boolean
 *         description: Chỉ hiện sự kiện gấp
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Danh sách sự kiện
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 */
// Public routes
router.get('/', optionalAuth, getEvents);

/**
 * @swagger
 * /api/events/{eventId}:
 *   get:
 *     summary: Xem chi tiết sự kiện
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết sự kiện
 *       404:
 *         description: Sự kiện không tồn tại
 */
router.get('/:eventId', optionalAuth, getEvent);

/**
 * @swagger
 * /api/events/btc/events:
 *   post:
 *     summary: Tạo sự kiện mới (BTC)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - location
 *               - eventType
 *               - salary
 *               - startTime
 *               - endTime
 *               - deadline
 *               - quantity
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               eventType:
 *                 type: string
 *                 enum: [Concert, Workshop, Festival, Conference, Sports, Exhibition, Other]
 *               salary:
 *                 type: string
 *               benefits:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               urgent:
 *                 type: boolean
 *                 description: Premium feature
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Tạo sự kiện thành công
 *       403:
 *         description: Đã hết quota hoặc không có quyền
 */
// BTC routes
router.post('/btc/events', protect, isBTC, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('eventType').notEmpty().withMessage('Event type is required'),
  body('salary').notEmpty().withMessage('Salary is required'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').isISO8601().withMessage('Valid end time is required'),
  body('deadline').isISO8601().withMessage('Valid deadline is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  validate
], createEvent);

/**
 * @swagger
 * /api/events/btc/events/{id}:
 *   put:
 *     summary: Cập nhật sự kiện (BTC)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       403:
 *         description: Không có quyền
 */
router.put('/btc/events/:id', protect, isBTC, updateEvent);

/**
 * @swagger
 * /api/events/btc/events/{id}:
 *   delete:
 *     summary: Xóa sự kiện (BTC)
 *     tags: [Events]
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
 *         description: Xóa thành công
 *       400:
 *         description: Không thể xóa sự kiện có ứng viên
 */
router.delete('/btc/events/:id', protect, isBTC, deleteEvent);

/**
 * @swagger
 * /api/events/btc/events:
 *   get:
 *     summary: Lấy danh sách sự kiện của BTC
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách sự kiện
 */
router.get('/btc/events', protect, isBTC, getMyEvents);

module.exports = router;
