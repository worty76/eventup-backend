# API Endpoints Reference

## Base URL
```
http://localhost:5000/api
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { },
  "message": "Optional message"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

## Authentication
Most endpoints require JWT authentication. Include token in header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Health Check

### Check API Health
```http
GET /health
```
**Response:**
```json
{
  "status": "ok",
  "service": "job-event-platform",
  "timestamp": "2026-01-16T14:30:00Z"
}
```

### Detailed Health Check
```http
GET /health/details
```

---

## 2. Authentication

### Register CTV
```http
POST /auth/register/ctv
Content-Type: application/json

{
  "email": "ctv@example.com",
  "password": "password123",
  "fullName": "Nguyen Van A",
  "phone": "0901234567",
  "gender": "MALE",
  "address": "Ha Noi"
}
```

### Register BTC
```http
POST /auth/register/btc
Content-Type: application/json

{
  "email": "btc@company.com",
  "password": "password123",
  "agencyName": "ABC Events",
  "phone": "0909999999",
  "address": "Ho Chi Minh",
  "logoUrl": "https://example.com/logo.png"
}
```

### Send OTP
```http
POST /auth/send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Verify OTP
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "role": "CTV"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "role": "CTV",
    "status": "ACTIVE"
  }
}
```

---

## 3. User & Profile

### Get Current User
```http
GET /users/me
Authorization: Bearer <token>
```

### Update Profile
```http
PUT /users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "0901234567"
}
```

### Get CTV CV
```http
GET /users/ctv/cv
Authorization: Bearer <token>
```

### Update CTV CV
```http
PUT /users/ctv/cv
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Nguyen Van A",
  "skills": ["Check-in", "Customer Service"],
  "experiences": ["Concert 2024", "Workshop 2025"]
}
```

---

## 4. Events

### Get All Events (Public)
```http
GET /events?keyword=concert&location=Ha Noi&urgent=true&page=1&limit=10
```

### Get Event Detail
```http
GET /events/:eventId
```

### Create Event (BTC)
```http
POST /events/btc/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Concert EDM 2026",
  "description": "Exciting EDM concert",
  "location": "Ha Noi",
  "eventType": "Concert",
  "salary": "300000",
  "benefits": "Free food, certificate",
  "startTime": "2026-03-10T08:00:00Z",
  "endTime": "2026-03-12T18:00:00Z",
  "deadline": "2026-03-01T23:59:59Z",
  "quantity": 50,
  "urgent": true,
  "requirements": ["Experience", "Good communication"]
}
```

### Update Event (BTC)
```http
PUT /events/btc/events/:id
Authorization: Bearer <token>
Content-Type: application/json
```

### Delete Event (BTC)
```http
DELETE /events/btc/events/:id
Authorization: Bearer <token>
```

### Get My Events (BTC)
```http
GET /events/btc/events?status=RECRUITING&page=1
Authorization: Bearer <token>
```

---

## 5. Applications

### Apply to Event (CTV)
```http
POST /events/:eventId/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "coverLetter": "I am very interested in this event..."
}
```

### Get My Applications (CTV)
```http
GET /ctv/applications?status=PENDING&page=1
Authorization: Bearer <token>
```

### Get Event Applications (BTC)
```http
GET /btc/events/:eventId/applications?status=PENDING
Authorization: Bearer <token>
```

### Approve Application (BTC)
```http
POST /btc/applications/:id/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "assignedRole": "Check-in Team"
}
```

### Reject Application (BTC)
```http
POST /btc/applications/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "rejectionReason": "Not enough experience"
}
```

### Bulk Approve (Premium BTC)
```http
POST /btc/applications/bulk-approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "applicationIds": ["id1", "id2", "id3"],
  "role": "Support Team"
}
```

---

## 6. Reviews

### CTV Review BTC
```http
POST /reviews/btc
Authorization: Bearer <token>
Content-Type: application/json

{
  "eventId": "...",
  "rating": 5,
  "comment": "Great organization!"
}
```

### BTC Review CTV
```http
POST /reviews/ctv
Authorization: Bearer <token>
Content-Type: application/json

{
  "eventId": "...",
  "ctvId": "...",
  "skill": 4,
  "attitude": 5,
  "comment": "Hardworking and professional"
}
```

---

## 7. Notifications

### Get Notifications
```http
GET /notifications?isRead=false&page=1
Authorization: Bearer <token>
```

### Mark as Read
```http
PUT /notifications/:id/read
Authorization: Bearer <token>
```

### Mark All as Read
```http
PUT /notifications/read-all
Authorization: Bearer <token>
```

---

## 8. Subscriptions

### Get Plans
```http
GET /subscriptions/plans
```

### Get Current Subscription
```http
GET /subscriptions/current
Authorization: Bearer <token>
```

### Upgrade to Premium
```http
POST /subscriptions/upgrade
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentMethod": "MOMO"
}
```

---

## 9. Payments

### Create Payment
```http
POST /payments/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 199000,
  "method": "MOMO",
  "description": "Premium subscription"
}
```

### Get Payment History
```http
GET /payments?status=SUCCESS&page=1
Authorization: Bearer <token>
```

---

## 10. File Upload

### Upload Single File
```http
POST /files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
type: "avatar"
```

### Upload Multiple Files
```http
POST /files/upload-multiple
Authorization: Bearer <token>
Content-Type: multipart/form-data

files: <binary[]>
type: "poster"
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400  | Bad Request - Invalid input |
| 401  | Unauthorized - Invalid/missing token |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found - Resource doesn't exist |
| 409  | Conflict - Duplicate resource |
| 500  | Internal Server Error |

---

## Rate Limiting

- Free users: 100 requests/hour
- Premium users: 1000 requests/hour

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Pagination: default page=1, limit=10
- Max file size: 5MB
- Supported image formats: jpeg, jpg, png, gif, webp
