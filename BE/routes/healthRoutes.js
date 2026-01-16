const express = require('express');
const { healthCheck, healthCheckDetails } = require('../controllers/healthController');

const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     description: Kiểm tra trạng thái cơ bản của API
 *     responses:
 *       200:
 *         description: API đang hoạt động
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: job-event-platform
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/', healthCheck);

/**
 * @swagger
 * /api/health/details:
 *   get:
 *     summary: Detailed health check
 *     tags: [Health]
 *     description: Kiểm tra chi tiết trạng thái các services (MongoDB, Redis, Email)
 *     responses:
 *       200:
 *         description: Chi tiết trạng thái services
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 services:
 *                   type: object
 *                   properties:
 *                     api:
 *                       type: string
 *                       example: up
 *                     mongodb:
 *                       type: string
 *                       example: up
 *                     redis:
 *                       type: string
 *                       example: up
 *                     email:
 *                       type: string
 *                       example: up
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Service degraded
 */
router.get('/details', healthCheckDetails);

module.exports = router;
