const { body, param, query } = require('express-validator');

// Auth validations
const registerCTVValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('phone').notEmpty().withMessage('Phone is required')
];

const registerBTCValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('agencyName').notEmpty().withMessage('Agency name is required'),
  body('phone').notEmpty().withMessage('Phone is required')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const otpValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
];

// Event validations
const createEventValidation = [
  body('title').notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('description').notEmpty().withMessage('Description is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('eventType').isIn(['Concert', 'Workshop', 'Festival', 'Conference', 'Sports', 'Exhibition', 'Other'])
    .withMessage('Invalid event type'),
  body('salary').notEmpty().withMessage('Salary is required'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').isISO8601().withMessage('Valid end time is required'),
  body('deadline').isISO8601().withMessage('Valid deadline is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

// Application validations
const applyToEventValidation = [
  body('coverLetter').optional().isString().isLength({ max: 1000 })
    .withMessage('Cover letter cannot exceed 1000 characters')
];

const bulkApproveValidation = [
  body('applicationIds').isArray({ min: 1 }).withMessage('Application IDs must be a non-empty array'),
  body('role').optional().isString()
];

// Review validations
const reviewBTCValidation = [
  body('eventId').notEmpty().withMessage('Event ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString().isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
];

const reviewCTVValidation = [
  body('eventId').notEmpty().withMessage('Event ID is required'),
  body('ctvId').notEmpty().withMessage('CTV ID is required'),
  body('skill').isInt({ min: 1, max: 5 }).withMessage('Skill rating must be between 1 and 5'),
  body('attitude').isInt({ min: 1, max: 5 }).withMessage('Attitude rating must be between 1 and 5'),
  body('comment').optional().isString().isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
];

// Payment validations
const createPaymentValidation = [
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('method').isIn(['MOMO', 'VNPAY', 'STRIPE', 'BANK_TRANSFER'])
    .withMessage('Invalid payment method')
];

// Subscription validations
const upgradeSubscriptionValidation = [
  body('paymentMethod').isIn(['MOMO', 'VNPAY', 'STRIPE'])
    .withMessage('Invalid payment method')
];

module.exports = {
  registerCTVValidation,
  registerBTCValidation,
  loginValidation,
  otpValidation,
  createEventValidation,
  applyToEventValidation,
  bulkApproveValidation,
  reviewBTCValidation,
  reviewCTVValidation,
  createPaymentValidation,
  upgradeSubscriptionValidation
};
