const redis = require('redis');

let redisClient = null;

const connectRedis = async () => {
  try {
    if (!process.env.REDIS_HOST) {
      console.log('⚠️ Redis configuration not found, skipping Redis connection');
      return null;
    }

    redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT || 6379
      },
      password: process.env.REDIS_PASSWORD || undefined
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis Connected');
    });

    await redisClient.connect();
    return redisClient;

  } catch (error) {
    console.warn('⚠️ Redis connection failed, continuing without cache:', error.message);
    return null;
  }
};

const getRedisClient = () => {
  return redisClient;
};

module.exports = { connectRedis, getRedisClient };
