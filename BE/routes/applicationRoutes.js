const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const {
  applyToEvent,
  getCTVApplications,
  getEventApplications,
  approveApplication,
  rejectApplication,
  bulkApproveApplications
} = require('../controllers/applicationController');
const { protect, isCTV, isBTC, isPremium } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/applications/events/{eventId}/apply:
 *   post:
 *     summary: Ứng tuyển vào sự kiện (CTV)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coverLetter:
 *                 type: string
 *                 description: Thư xin việc
 *     responses:
 *       201:
 *         description: Ứng tuyển thành công
 *       400:
 *         description: Đã ứng tuyển trước đó hoặc sự kiện không mở
 */
// CTV routes
router.post('/events/:eventId/apply', protect, isCTV, [
  body('coverLetter').optional().isString(),
  validate
], applyToEvent);

/**
 * @swagger
 * /api/applications/ctv/applications:
 *   get:
 *     summary: Xem danh sách ứng tuyển của CTV
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, withdrawn]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách ứng tuyển
 */
router.get('/ctv/applications', protect, isCTV, getCTVApplications);

/**
 * @swagger
 * /api/applications/btc/events/{eventId}/applications:
 *   get:
 *     summary: Xem danh sách ứng viên của sự kiện (BTC)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách ứng viên
 */
// BTC routes
router.get('/btc/events/:eventId/applications', protect, isBTC, getEventApplications);

/**
 * @swagger
 * /api/applications/btc/applications/{id}/approve:
 *   post:
 *     summary: Chấp nhận ứng viên (BTC)
 *     tags: [Applications]
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
 *               assignedRole:
 *                 type: string
 *     responses:
 *       200:
 *         description: Chấp nhận thành công
 */
router.post('/btc/applications/:id/approve', protect, isBTC, [
  body('assignedRole').optional().isString(),
  validate
], approveApplication);

/**
 * @swagger
 * /api/applications/btc/applications/{id}/reject:
 *   post:
 *     summary: Từ chối ứng viên (BTC)
 *     tags: [Applications]
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
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Từ chối thành công
 */
router.post('/btc/applications/:id/reject', protect, isBTC, [
  body('rejectionReason').optional().isString(),
  validate
], rejectApplication);

/**
 * @swagger
 * /api/applications/btc/applications/bulk-approve:
 *   post:
 *     summary: Chấp nhận nhiều ứng viên cùng lúc (BTC Premium)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - applicationIds
 *             properties:
 *               applicationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Chấp nhận thành công
 *       403:
 *         description: Yêu cầu gói Premium
 */
// Premium feature
router.post('/btc/applications/bulk-approve', protect, isBTC, isPremium, [
  body('applicationIds').isArray().withMessage('Application IDs must be an array'),
  body('role').optional().isString(),
  validate
], bulkApproveApplications);

module.exports = router;
