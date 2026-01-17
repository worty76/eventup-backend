# Sample Data Import Guide

## Hướng dẫn import dữ liệu mẫu vào MongoDB

### 1. Kết nối MongoDB Shell

```bash
mongosh job-event-platform
```

### 2. Import Users

```javascript
// User BTC
db.users.insertOne({
  email: "btc1@agency.com",
  passwordHash: "$2a$10$YourHashedPasswordHere",
  role: "BTC",
  phone: "0909999999",
  isPhoneVerified: true,
  isEmailVerified: true,
  status: "ACTIVE",
  subscription: {
    plan: "PREMIUM",
    expiredAt: new Date("2026-12-31"),
    urgentUsed: 1,
    postUsed: 3
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

// User CTV
db.users.insertOne({
  email: "ctv1@example.com",
  passwordHash: "$2a$10$YourHashedPasswordHere",
  role: "CTV",
  phone: "0901234567",
  isPhoneVerified: true,
  isEmailVerified: true,
  status: "ACTIVE",
  subscription: {
    plan: "FREE",
    expiredAt: null,
    urgentUsed: 0,
    postUsed: 2
  },
  createdAt: new Date(),
  updatedAt: new Date()
});
```

### 3. Lấy User IDs

```javascript
// Lưu lại các ID để dùng cho bước tiếp theo
const btcUserId = db.users.findOne({email: "btc1@agency.com"})._id;
const ctvUserId = db.users.findOne({email: "ctv1@example.com"})._id;

print("BTC User ID: " + btcUserId);
print("CTV User ID: " + ctvUserId);
```

### 4. Import CTV Profile

```javascript
db.ctv_profiles.insertOne({
  userId: ctvUserId,
  fullName: "Nguyễn Văn A",
  avatar: "https://via.placeholder.com/150",
  gender: "MALE",
  address: "Hà Nội",
  skills: ["Giao tiếp", "Check-in", "Soát vé", "Hướng dẫn khách"],
  experiences: ["Concert Mỹ Đình 2024", "Workshop CNTT 2025"],
  joinedEvents: [],
  reputation: {
    score: 10,
    totalReviews: 0
  },
  createdAt: new Date(),
  updatedAt: new Date()
});
```

### 5. Import BTC Profile

```javascript
db.btc_profiles.insertOne({
  userId: btcUserId,
  agencyName: "ABC Entertainment",
  logo: "https://via.placeholder.com/200",
  address: "Hồ Chí Minh",
  website: "https://abc-entertainment.com",
  fanpage: "https://facebook.com/abc.entertainment",
  description: "Công ty tổ chức sự kiện hàng đầu Việt Nam",
  verified: true,
  successfulEvents: [],
  rating: {
    average: 0,
    totalReviews: 0
  },
  createdAt: new Date(),
  updatedAt: new Date()
});
```

### 6. Import Events

```javascript
db.events.insertOne({
  btcId: btcUserId,
  title: "Concert EDM 2026",
  description: "Cần CTV hỗ trợ check-in, hướng dẫn khách tại sự kiện EDM lớn nhất năm 2026",
  location: "Sân vận động Mỹ Đình, Hà Nội",
  eventType: "Concert",
  salary: "300.000 VNĐ/ngày",
  benefits: "Ăn uống, chứng nhận tham gia, networking",
  startTime: new Date("2026-03-10T08:00:00Z"),
  endTime: new Date("2026-03-12T18:00:00Z"),
  deadline: new Date("2026-03-01T23:59:59Z"),
  quantity: 50,
  appliedCount: 0,
  poster: "https://via.placeholder.com/800x600",
  urgent: true,
  status: "RECRUITING",
  views: 120,
  requirements: [
    "Có kinh nghiệm làm việc tại sự kiện",
    "Giao tiếp tốt",
    "Năng động, nhiệt tình"
  ],
  createdAt: new Date(),
  updatedAt: new Date()
});

db.events.insertOne({
  btcId: btcUserId,
  title: "Workshop Khởi nghiệp 2026",
  description: "Hỗ trợ tổ chức workshop về khởi nghiệp công nghệ",
  location: "Trung tâm Hội nghị Quốc gia, Hà Nội",
  eventType: "Workshop",
  salary: "250.000 VNĐ/ngày",
  benefits: "Được tham gia workshop miễn phí, ăn trưa",
  startTime: new Date("2026-02-20T09:00:00Z"),
  endTime: new Date("2026-02-20T17:00:00Z"),
  deadline: new Date("2026-02-15T23:59:59Z"),
  quantity: 20,
  appliedCount: 0,
  poster: "https://via.placeholder.com/800x600",
  urgent: false,
  status: "RECRUITING",
  views: 75,
  requirements: [
    "Có kiến thức về công nghệ",
    "Tiếng Anh giao tiếp cơ bản"
  ],
  createdAt: new Date(),
  updatedAt: new Date()
});

db.events.insertOne({
  btcId: btcUserId,
  title: "Festival Âm nhạc Mùa hè",
  description: "Cần nhiều CTV hỗ trợ tại các khu vực: Check-in, Soát vé, Hướng dẫn, An ninh",
  location: "Công viên Yên Sở, Hà Nội",
  eventType: "Festival",
  salary: "350.000 VNĐ/ngày",
  benefits: "Xem concert miễn phí, quà tặng, ăn uống",
  startTime: new Date("2026-06-15T15:00:00Z"),
  endTime: new Date("2026-06-16T23:00:00Z"),
  deadline: new Date("2026-06-05T23:59:59Z"),
  quantity: 100,
  appliedCount: 15,
  poster: "https://via.placeholder.com/800x600",
  urgent: true,
  status: "RECRUITING",
  views: 350,
  requirements: [
    "Có sức khỏe tốt",
    "Làm việc theo ca",
    "Có tinh thần trách nhiệm cao"
  ],
  createdAt: new Date(),
  updatedAt: new Date()
});
```

### 7. Import Application (sample)

```javascript
const eventId = db.events.findOne({title: "Concert EDM 2026"})._id;

db.applications.insertOne({
  eventId: eventId,
  ctvId: ctvUserId,
  coverLetter: "Em đã có kinh nghiệm check-in tại nhiều concert lớn. Em rất mong được tham gia sự kiện này.",
  status: "PENDING",
  assignedRole: null,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

### 8. Import Notification (sample)

```javascript
db.notifications.insertOne({
  userId: btcUserId,
  type: "APPLICATION",
  title: "Có ứng viên mới",
  content: "Có ứng viên mới cho sự kiện Concert EDM 2026",
  isRead: false,
  relatedId: db.applications.findOne()._id,
  relatedModel: "Application",
  metadata: {},
  createdAt: new Date()
});
```

### 9. Verify Data

```javascript
// Kiểm tra số lượng documents
print("Users: " + db.users.countDocuments());
print("CTV Profiles: " + db.ctv_profiles.countDocuments());
print("BTC Profiles: " + db.btc_profiles.countDocuments());
print("Events: " + db.events.countDocuments());
print("Applications: " + db.applications.countDocuments());
print("Notifications: " + db.notifications.countDocuments());
```

## Hoặc import từ file JSON

Nếu bạn có file JSON, sử dụng mongoimport:

```bash
mongoimport --db job-event-platform --collection users --file users.json --jsonArray
mongoimport --db job-event-platform --collection events --file events.json --jsonArray
```

## Test API với sample data

Sau khi import, bạn có thể test API:

### Login
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "btc1@agency.com",
  "password": "password123",
  "role": "BTC"
}
```

### Get Events
```bash
GET http://localhost:5000/api/events?location=Hà Nội&urgent=true
```

### Apply to Event (CTV)
```bash
POST http://localhost:5000/api/events/{eventId}/apply
Authorization: Bearer {token}
Content-Type: application/json

{
  "coverLetter": "Tôi rất muốn tham gia sự kiện này"
}
```

**Lưu ý**: Các mật khẩu trong sample data cần được hash trước. Bạn có thể sử dụng API register hoặc hash manually với bcrypt.
