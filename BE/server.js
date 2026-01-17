require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/database');
const { connectRedis } = require('./config/redis');
const { initCronJobs } = require('./utils/cronJobs');
const socketIO = require('socket.io');

// Connect to database
connectDB();

// Connect to Redis (optional)
connectRedis().catch(err => {
  console.log('Continuing without Redis');
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO for real-time notifications
const io = socketIO(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join user-specific room
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Leave room
  socket.on('leave', (userId) => {
    socket.leave(`user_${userId}`);
    console.log(`User ${userId} left their room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Initialize cron jobs
initCronJobs();

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════════╗
  ║   🚀 Server is running on port ${PORT}        ║
  ║   📱 Environment: ${process.env.NODE_ENV || 'development'}                  ║
  ║   🌐 API: http://localhost:${PORT}             ║
  ║   ❤️  Health: http://localhost:${PORT}/api/health ║
  ╚════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

module.exports = server;
