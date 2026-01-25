const { getRedisClient } = require('../config/redis');
const mongoose = require('mongoose');

// @desc    Basic Health Check
// @route   GET /api/health
// @access  Public
exports.healthCheck = async (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'job-event-platform',
    timestamp: new Date().toISOString()
  });
};

// @desc    Detailed Health Check
// @route   GET /api/health/details
// @access  Public
exports.healthCheckDetails = async (req, res) => {
  const services = {
    api: 'up',
    mongodb: 'down',
    redis: 'down',
    email: 'up' // Assumed up unless specifically checked
  };

  // Check MongoDB
  try {
    if (mongoose.connection.readyState === 1) {
      services.mongodb = 'up';
    }
  } catch (error) {
    services.mongodb = 'down';
  }

  try {
    const redisClient = getRedisClient();
    if (redisClient && redisClient.isOpen) {
      await redisClient.ping();
      services.redis = 'up';
    }
  } catch (error) {
    services.redis = 'down';
  }

  const allUp = Object.values(services).every(status => status === 'up');
  const overallStatus = allUp ? 'ok' : 'degraded';

  res.status(allUp ? 200 : 503).json({
    status: overallStatus,
    services,
    timestamp: new Date().toISOString()
  });
};
