# Job & Event Platform - Backend API

Backend API cho nền tảng tìm việc và đăng tin tuyển dụng sự kiện, được xây dựng với Node.js, Express và MongoDB.

## 🚀 Công nghệ sử dụng

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Socket.IO** - Real-time notifications
- **Cloudinary** - File upload
- **Nodemailer** - Email service
- **Node-cron** - Scheduled tasks
- **Redis** - Caching (optional)

## 📋 Yêu cầu hệ thống

- Node.js >= 14.x
- MongoDB >= 4.x
- npm hoặc yarn

## ⚙️ Cài đặt

### 1. Clone repository và cài đặt dependencies

```bash
cd BE
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Cập nhật các biến môi trường trong file `.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/job-event-platform

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d

# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Cloudinary (đăng ký tại cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Khởi động MongoDB

Đảm bảo MongoDB đang chạy:

```bash
# Windows
mongod

# Linux/Mac
sudo systemctl start mongod
```

### 4. Chạy server

```bash
# Development mode với nodemon
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

## 📚 API Documentation

### Health Check

- `GET /api/health` - Basic health check
- `GET /api/health/details` - Detailed health check (DB, Redis, Email)

### Authentication

- `POST /api/auth/register/ctv` - Đăng ký CTV
- `POST /api/auth/register/btc` - Đăng ký BTC
- `POST /api/auth/send-otp` - Gửi OTP
- `POST /api/auth/verify-otp` - Xác thực OTP
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/refresh-token` - Refresh token
- `POST /api/auth/logout` - Đăng xuất

### Users & Profiles

- `GET /api/users/me` - Lấy thông tin user hiện tại
- `PUT /api/users/me` - Cập nhật thông tin user
- `GET /api/users/ctv/cv` - Lấy CV CTV
- `PUT /api/users/ctv/cv` - Cập nhật CV CTV
- `GET /api/users/btc/profile` - Lấy profile BTC
- `PUT /api/users/btc/profile` - Cập nhật profile BTC

### Events

- `GET /api/events` - Lấy danh sách sự kiện (Public)
- `GET /api/events/:eventId` - Xem chi tiết sự kiện
- `POST /api/events/btc/events` - Tạo sự kiện (BTC)
- `PUT /api/events/btc/events/:id` - Cập nhật sự kiện (BTC)
- `DELETE /api/events/btc/events/:id` - Xóa sự kiện (BTC)
- `GET /api/events/btc/events` - Lấy sự kiện của BTC

### Applications

- `POST /api/events/:eventId/apply` - Ứng tuyển (CTV)
- `GET /api/ctv/applications` - Xem danh sách ứng tuyển (CTV)
- `GET /api/btc/events/:eventId/applications` - Xem ứng viên (BTC)
- `POST /api/btc/applications/:id/approve` - Duyệt ứng viên (BTC)
- `POST /api/btc/applications/:id/reject` - Từ chối ứng viên (BTC)
- `POST /api/btc/applications/bulk-approve` - Duyệt hàng loạt (Premium BTC)

### Reviews

- `POST /api/reviews/btc` - CTV đánh giá BTC
- `POST /api/reviews/ctv` - BTC đánh giá CTV
- `GET /api/reviews/user/:userId` - Xem đánh giá của user

### Notifications

- `GET /api/notifications` - Lấy thông báo
- `PUT /api/notifications/:id/read` - Đánh dấu đã đọc
- `PUT /api/notifications/read-all` - Đánh dấu tất cả đã đọc
- `DELETE /api/notifications/:id` - Xóa thông báo

### Subscriptions

- `GET /api/subscriptions/plans` - Xem các gói
- `GET /api/subscriptions/current` - Xem gói hiện tại
- `POST /api/subscriptions/upgrade` - Nâng cấp Premium
- `POST /api/subscriptions/cancel` - Hủy gói

### Payments

- `POST /api/payments/create` - Tạo thanh toán
- `POST /api/payments/:id/process` - Xử lý thanh toán
- `GET /api/payments` - Lịch sử thanh toán
- `POST /api/payments/webhook` - Webhook từ payment gateway

### Files

- `POST /api/files/upload` - Upload file
- `POST /api/files/upload-multiple` - Upload nhiều file
- `DELETE /api/files/:publicId` - Xóa file

## 🗄️ Database Models

### Users
- Email, password, role (CTV/BTC)
- Subscription info (plan, expiry)
- Status (ACTIVE/BLOCKED/PENDING)

### CTV Profile
- Full name, avatar, gender
- Skills, experiences
- Reputation score

### BTC Profile
- Agency name, logo
- Website, fanpage
- Verification status

### Events
- Title, description, location
- Event type, salary, benefits
- Start/end time, deadline
- Urgent flag (Premium)

### Applications
- Event, CTV reference
- Cover letter
- Status (PENDING/APPROVED/REJECTED/COMPLETED)

### Reviews
- Event, from/to user
- Rating, skill, attitude
- Comment

### Notifications
- User, type, content
- Read status
- Related model reference

### Payments
- User, amount, method
- Transaction ID
- Status, metadata

## 🔐 Authentication

API sử dụng JWT (JSON Web Tokens) cho authentication.

**Header format:**
```
Authorization: Bearer <token>
```

## 🔄 Real-time Features

Socket.IO được sử dụng cho notifications real-time:

```javascript
// Client-side example
const socket = io('http://localhost:5000');

// Join user's room
socket.emit('join', userId);

// Listen for notifications
socket.on('notification', (data) => {
  console.log('New notification:', data);
});
```

## ⏰ Cron Jobs

Hệ thống tự động chạy các tasks:

- **Hourly**: Cập nhật trạng thái sự kiện
- **Daily**: Kiểm tra subscription hết hạn
- **Monthly**: Reset giới hạn post/urgent

## 🧪 Testing

```bash
npm test
```

## 📝 Sample Data

Import sample data vào MongoDB:

```bash
mongosh job-event-platform

# Copy và paste các lệnh từ phần "DATA MẪU IMPORT MONGO" trong tài liệu yêu cầu
```

## 🐛 Debugging

Logs được in ra console với các ký hiệu:
- ✅ Success
- ❌ Error
- ⚠️ Warning
- 🕐 Cron job running

## 📦 Project Structure

```
BE/
├── config/           # Configuration files
├── controllers/      # Request handlers
├── middleware/       # Custom middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── utils/           # Helper functions
├── app.js           # Express app setup
├── server.js        # Server entry point
└── package.json     # Dependencies
```

## 🚀 Deployment

### Production checklist:
- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets
- [ ] Configure CORS properly
- [ ] Set up MongoDB Atlas or production DB
- [ ] Configure email service
- [ ] Set up Cloudinary
- [ ] Configure payment gateways
- [ ] Set up monitoring
- [ ] Enable HTTPS

## 📄 License

ISC

## 👥 Support

Nếu có vấn đề, vui lòng tạo issue trên GitHub repository.
