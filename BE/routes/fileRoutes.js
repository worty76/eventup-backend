const express = require('express');
const upload = require('../middleware/upload');
const {
  uploadFile,
  deleteFile,
  uploadMultipleFiles
} = require('../controllers/fileController');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Upload file lên Cloudinary
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                 publicId:
 *                   type: string
 */
router.post('/upload', protect, upload.single('file'), uploadFile);

/**
 * @swagger
 * /api/files/upload-multiple:
 *   post:
 *     summary: Upload nhiều file (tối đa 10)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 10
 *     responses:
 *       200:
 *         description: Upload thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                       publicId:
 *                         type: string
 */
router.post('/upload-multiple', protect, upload.array('files', 10), uploadMultipleFiles);

/**
 * @swagger
 * /api/files/{publicId}:
 *   delete:
 *     summary: Xóa file từ Cloudinary
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Public ID của file trên Cloudinary
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/:publicId', protect, deleteFile);

module.exports = router;
