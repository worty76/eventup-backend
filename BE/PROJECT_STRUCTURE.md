# 📁 Project Structure

```
BE/
│
├── 📁 config/                    # Configuration files
│   ├── database.js              # MongoDB connection
│   ├── redis.js                 # Redis connection (optional)
│   └── passport.js              # Google OAuth config
│
├── 📁 controllers/               # Request handlers
│   ├── authController.js        # Authentication logic
│   ├── userController.js        # User & profile management
│   ├── eventController.js       # Event CRUD operations
│   ├── applicationController.js # Application management
│   ├── reviewController.js      # Review & rating system
│   ├── notificationController.js# Notification management
│   ├── subscriptionController.js# Subscription plans
│   ├── paymentController.js     # Payment processing
│   ├── fileController.js        # File upload
│   └── healthController.js      # Health check
│
├── 📁 middleware/                # Custom middleware
│   ├── auth.js                  # JWT authentication & authorization
│   ├── errorHandler.js          # Global error handler
│   ├── validate.js              # Request validation
│   └── upload.js                # File upload (Multer)
│
├── 📁 models/                    # Mongoose schemas
│   ├── User.js                  # User model (CTV & BTC)
│   ├── CTVProfile.js            # CTV profile & CV
│   ├── BTCProfile.js            # BTC company profile
│   ├── Event.js                 # Job/Event postings
│   ├── Application.js           # Job applications
│   ├── Review.js                # Reviews & ratings
│   ├── Notification.js          # User notifications
│   ├── Payment.js               # Payment records
│   └── index.js                 # Export all models
│
├── 📁 routes/                    # API routes
│   ├── authRoutes.js            # /api/auth/*
│   ├── userRoutes.js            # /api/users/*
│   ├── eventRoutes.js           # /api/events/*
│   ├── applicationRoutes.js     # /api/applications/*
│   ├── reviewRoutes.js          # /api/reviews/*
│   ├── notificationRoutes.js    # /api/notifications/*
│   ├── subscriptionRoutes.js    # /api/subscriptions/*
│   ├── paymentRoutes.js         # /api/payments/*
│   ├── fileRoutes.js            # /api/files/*
│   └── healthRoutes.js          # /api/health/*
│
├── 📁 utils/                     # Helper functions
│   ├── email.js                 # Email sending utilities
│   ├── cronJobs.js              # Scheduled tasks
│   └── validations.js           # Validation schemas
│
├── 📄 app.js                     # Express app configuration
├── 📄 server.js                  # Server entry point
├── 📄 package.json               # Dependencies
├── 📄 .env                       # Environment variables
├── 📄 .env.example               # Environment template
├── 📄 .gitignore                 # Git ignore rules
├── 📄 README.md                  # Project documentation
├── 📄 API_DOCUMENTATION.md       # API reference
└── 📄 SAMPLE_DATA.md             # Sample data guide
```

## 🔑 Key Features Implemented

### ✅ Authentication & Authorization
- JWT-based authentication
- Role-based access control (CTV, BTC, ADMIN)
- OTP verification via email
- Google OAuth integration (prepared)
- Refresh token mechanism

### ✅ User Management
- Separate profiles for CTV (workers) and BTC (employers)
- Mini CV for CTV with skills, experiences
- Company profiles for BTC
- Reputation & rating systems

### ✅ Event Management
- CRUD operations for job postings
- Advanced filtering (location, salary, type, urgent)
- Auto status updates (PREPARING → RECRUITING → COMPLETED)
- Post limits (Free: 5/month, Premium: 50/month)
- Urgent tags (Premium only)

### ✅ Application System
- CTV apply to events
- BTC review & approve/reject applications
- Bulk approval (Premium feature)
- Role assignment for approved candidates
- Application status tracking

### ✅ Review & Rating
- Bidirectional reviews (CTV ↔ BTC)
- Skill & attitude ratings for CTV
- Overall ratings for BTC
- Auto-update reputation scores

### ✅ Subscription & Payments
- Free & Premium plans
- Payment gateway integration (VNPay, Momo, Stripe prepared)
- Auto subscription expiry handling
- Monthly usage limits

### ✅ Notifications
- Real-time via Socket.IO
- Email notifications
- Type-based filtering
- Read/unread status

### ✅ File Management
- Cloudinary integration
- Image upload (avatar, logo, poster)
- Multiple file uploads
- File size & type validation

### ✅ Background Jobs
- Hourly: Update event status
- Daily: Check expired subscriptions
- Monthly: Reset usage limits

### ✅ Health Monitoring
- Basic health check
- Detailed service status (MongoDB, Redis, Email)

## 🛠️ Technologies Used

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | MongoDB + Mongoose |
| **Authentication** | JWT, Passport.js |
| **File Storage** | Cloudinary |
| **Email** | Nodemailer |
| **Real-time** | Socket.IO |
| **Caching** | Redis (optional) |
| **Validation** | express-validator |
| **Scheduling** | node-cron |

## 📊 Database Collections

1. **users** - User accounts (CTV & BTC)
2. **ctv_profiles** - CTV worker profiles
3. **btc_profiles** - BTC employer profiles
4. **events** - Job/event postings
5. **applications** - Job applications
6. **reviews** - User reviews
7. **notifications** - User notifications
8. **payments** - Payment records

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Start MongoDB
mongod

# 4. Run development server
npm run dev

# 5. Access API
http://localhost:5000
```

## 📝 API Endpoints Summary

| Domain | Endpoints | Description |
|--------|-----------|-------------|
| **Health** | GET /api/health | Health checks |
| **Auth** | POST /api/auth/* | Registration, login, OTP |
| **Users** | GET/PUT /api/users/* | Profile management |
| **Events** | GET/POST/PUT/DELETE /api/events/* | Event CRUD |
| **Applications** | POST/GET /api/*/applications | Apply & review |
| **Reviews** | POST /api/reviews/* | Rating system |
| **Notifications** | GET/PUT /api/notifications/* | Notification management |
| **Subscriptions** | GET/POST /api/subscriptions/* | Plan management |
| **Payments** | POST /api/payments/* | Payment processing |
| **Files** | POST /api/files/* | File uploads |

## 🔐 Security Features

- Password hashing with bcrypt
- JWT token authentication
- HTTP-only cookies
- CORS configuration
- Input validation & sanitization
- Rate limiting (prepared)
- Error handling without sensitive info

## 📈 Scalability

- MongoDB indexing for performance
- Redis caching (optional)
- Background job processing
- Socket.IO for real-time features
- Cloudinary for file storage

## 🧪 Testing

All endpoints can be tested using:
- Postman
- Thunder Client (VS Code)
- cURL
- Any HTTP client

Import the API documentation into Postman for easy testing.

## 📞 Support

For issues or questions:
1. Check README.md
2. Review API_DOCUMENTATION.md
3. Check SAMPLE_DATA.md for data examples

---

**Status**: ✅ Ready for development and testing
**Last Updated**: January 16, 2026
