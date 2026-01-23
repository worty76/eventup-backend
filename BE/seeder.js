const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

// Load env vars
dotenv.config();

// Load models
const User = require("./models/User");
const BTCProfile = require("./models/BTCProfile");
const CTVProfile = require("./models/CTVProfile");
const Event = require("./models/Event");
const Application = require("./models/Application"); // Assuming you have this
const Notification = require("./models/Notification"); // Assuming you have this
const Review = require("./models/Review"); // Assuming you have this

// Connect to DB
mongoose.connect(process.env.MONGODB_URI);

// Sample Data
const users = [
  // BTC Accounts
  {
    _id: new mongoose.Types.ObjectId("65a000000000000000000001"),
    email: "btc1@eventup.vn",
    passwordHash: "123456",
    role: "BTC",
    phone: "0901111111",
    isEmailVerified: true,
    status: "ACTIVE",
    subscription: { plan: "PREMIUM", expiredAt: new Date("2025-12-31") },
  },
  {
    _id: new mongoose.Types.ObjectId("65a000000000000000000002"),
    email: "btc2@eventup.vn",
    passwordHash: "123456",
    role: "BTC",
    phone: "0902222222",
    isEmailVerified: true,
    status: "ACTIVE",
  },
  // CTV Accounts
  {
    _id: new mongoose.Types.ObjectId("65a000000000000000000003"),
    email: "ctv1@eventup.vn",
    passwordHash: "123456",
    role: "CTV",
    phone: "0903333333",
    isEmailVerified: true,
    status: "ACTIVE",
  },
  {
    _id: new mongoose.Types.ObjectId("65a000000000000000000004"),
    email: "ctv2@eventup.vn",
    passwordHash: "123456",
    role: "CTV",
    phone: "0904444444",
    isEmailVerified: true,
    status: "ACTIVE",
  },
  {
    _id: new mongoose.Types.ObjectId("65a000000000000000000005"),
    email: "ctv3@eventup.vn",
    passwordHash: "123456",
    role: "CTV",
    phone: "0905555555",
    isEmailVerified: true,
    status: "ACTIVE",
  },
];

const btcProfiles = [
  {
    userId: users[0]._id,
    agencyName: "Công ty Sự kiện Việt Nam (Viet Event)",
    logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    address: "Quận 1, TP. Hồ Chí Minh",
    website: "https://vietevent.vn",
    description:
      "Chuyên tổ chức các sự kiện âm nhạc và giải trí hàng đầu Việt Nam.",
    verified: true,
    rating: { average: 4.8, totalReviews: 120 },
  },
  {
    userId: users[1]._id,
    agencyName: "Hà Nội Media Group",
    logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    address: "Cầu Giấy, Hà Nội",
    website: "https://hanoimedia.vn",
    description: "Đơn vị tổ chức hội thảo và triển lãm chuyên nghiệp.",
    verified: false,
    rating: { average: 4.2, totalReviews: 45 },
  },
];

const ctvProfiles = [
  {
    userId: users[2]._id,
    fullName: "Nguyễn Văn Nam",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    gender: "MALE",
    address: "Thủ Đức, TP. Hồ Chí Minh",
    skills: ["Chụp ảnh", "Giao tiếp", "Check-in"],
    experiences: [
      "Tình nguyện viên Mùa Hè Xanh 2024",
      "CTV sự kiện Tiger Remix",
    ],
    reputation: { score: 9.5, totalReviews: 10 },
  },
  {
    userId: users[3]._id,
    fullName: "Trần Thị Mai",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    gender: "FEMALE",
    address: "Đống Đa, Hà Nội",
    skills: ["PG", "MC", "Tiếng Anh"],
    experiences: ["PG cho Honda Việt Nam", "MC sự kiện khai trương"],
    reputation: { score: 9.8, totalReviews: 15 },
  },
  {
    userId: users[4]._id,
    fullName: "Lê Văn Hùng",
    avatar:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    gender: "MALE",
    address: "Hải Châu, Đà Nẵng",
    skills: ["Hậu cần", "An ninh", "Bê vác"],
    experiences: ["Hỗ trợ Marathon Quốc tế Đà Nẵng"],
    reputation: { score: 8.5, totalReviews: 5 },
  },
];

// Generate 20 Test BTC Accounts
for (let i = 1; i <= 20; i++) {
  const userId = new mongoose.Types.ObjectId();
  users.push({
    _id: userId,
    email: `btc_test_${i}@gmail.com`,
    passwordHash: "123456", // Will be hashed in importData
    role: "BTC",
    phone: `09000000${i.toString().padStart(2, "0")}`,
    isEmailVerified: true,
    status: "ACTIVE",
    subscription: { plan: "PREMIUM", expiredAt: new Date("2026-12-31") },
  });

  btcProfiles.push({
    userId: userId,
    agencyName: `Test Agency ${i}`,
    logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=500&auto=format&fit=crop&q=60",
    address: `District ${i}, Ho Chi Minh City`,
    website: `https://test-agency-${i}.vn`,
    description: `This is a test agency account number ${i} for system testing purposes.`,
    verified: true,
    rating: { average: 4.5, totalReviews: 10 + i },
  });
}

const events = [
  {
    _id: new mongoose.Types.ObjectId("65d000000000000000000001"),
    btcId: users[0]._id,
    title: "Đại nhạc hội EDM Ravolution 2026",
    description:
      "Cần tuyển 50 CTV hỗ trợ check-in, soát vé và hướng dẫn khán giả tại sự kiện âm nhạc điện tử lớn nhất năm. Yêu cầu nhanh nhẹn, nhiệt tình.",
    location: "SECC, Quận 7, TP. Hồ Chí Minh",
    eventType: "Festival",
    salary: "500.000 VNĐ/ngày",
    benefits: "Bao ăn uống, áo đồng phục, được xem show miễn phí khi hết ca.",
    startTime: new Date("2026-05-15T14:00:00"),
    endTime: new Date("2026-05-15T23:00:00"),
    deadline: new Date("2026-05-01T00:00:00"),
    quantity: 50,
    appliedCount: 12,
    poster:
      "https://images.unsplash.com/photo-1459749411177-287ce63e3ba0?w=800&auto=format&fit=crop&q=60",
    urgent: true,
    status: "RECRUITING",
    views: 1250,
    requirements: [
      "Trên 18 tuổi",
      "Có sức khỏe tốt",
      "Ưu tiên sinh viên các trường ĐH tại TP.HCM",
    ],
  },
  {
    _id: new mongoose.Types.ObjectId("65d000000000000000000002"),
    btcId: users[0]._id,
    title: "Hội thảo Công nghệ Tech Summit 2026",
    description:
      "Tuyển CTV hỗ trợ đón tiếp đại biểu, phát tài liệu và mic runner trong hội trường.",
    location: "Gem Center, Quận 1, TP. Hồ Chí Minh",
    eventType: "Conference",
    salary: "300.000 VNĐ/buổi",
    benefits:
      "Chứng nhận tham gia, cơ hội networking với các công ty công nghệ.",
    startTime: new Date("2026-06-10T08:00:00"),
    endTime: new Date("2026-06-10T17:00:00"),
    deadline: new Date("2026-06-01T00:00:00"),
    quantity: 20,
    appliedCount: 5,
    poster:
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&auto=format&fit=crop&q=60",
    urgent: false,
    status: "RECRUITING",
    views: 450,
    requirements: ["Ngoại hình sáng", "Tiếng Anh giao tiếp cơ bản"],
  },
  {
    _id: new mongoose.Types.ObjectId("65d000000000000000000003"),
    btcId: users[1]._id,
    title: "Triển lãm Auto Expo Hà Nội",
    description:
      "Cần tuyển PG/PB đứng booth giới thiệu sản phẩm xe hơi mới ra mắt.",
    location: "ICE Hà Nội, Hoàn Kiếm, Hà Nội",
    eventType: "Exhibition",
    salary: "800.000 VNĐ/ngày",
    benefits: "Thưởng doanh số nếu có khách đặt cọc, hỗ trợ trang điểm.",
    startTime: new Date("2026-04-20T09:00:00"),
    endTime: new Date("2026-04-22T18:00:00"),
    deadline: new Date("2026-04-10T00:00:00"),
    quantity: 10,
    appliedCount: 8,
    poster:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&auto=format&fit=crop&q=60",
    urgent: true,
    status: "RECRUITING",
    views: 890,
    requirements: [
      "Nam cao > 1m75, Nữ cao > 1m65",
      "Kinh nghiệm làm PG/PB xe hơi là lợi thế",
    ],
  },
  {
    _id: new mongoose.Types.ObjectId("65d000000000000000000004"),
    btcId: users[1]._id,
    title: "Workshop Kỹ năng mềm cho sinh viên",
    description: "Hỗ trợ setup hội trường, chuẩn bị teabreak cho workshop.",
    location: "Đại học Quốc Gia Hà Nội",
    eventType: "Workshop",
    salary: "150.000 VNĐ/buổi",
    benefits: "Được tham gia workshop miễn phí.",
    startTime: new Date("2026-03-25T13:30:00"),
    endTime: new Date("2026-03-25T17:30:00"),
    deadline: new Date("2026-03-20T00:00:00"),
    quantity: 5,
    appliedCount: 0,
    poster:
      "https://images.unsplash.com/photo-1544531696-60c35eb79836?w=800&auto=format&fit=crop&q=60",
    urgent: false,
    status: "RECRUITING",
    views: 120,
    requirements: ["Sinh viên năm 1, 2", "Nhiệt tình, chăm chỉ"],
  },
  {
    _id: new mongoose.Types.ObjectId("65d000000000000000000005"),
    btcId: users[0]._id, // Hosting in Da Nang but by HCMC company (example)
    title: "Lễ hội Pháo hoa Quốc tế Đà Nẵng DIFF 2026",
    description:
      "Tuyển số lượng lớn CTV hỗ trợ dẫn đoàn, an ninh vòng ngoài và khu vực khán đài.",
    location: "Bờ sông Hàn, Đà Nẵng",
    eventType: "Festival",
    salary: "400.000 VNĐ/ca",
    benefits: "Hỗ trợ ăn tối, nước uống, xem pháo hoa.",
    startTime: new Date("2026-06-01T18:00:00"),
    endTime: new Date("2026-07-01T22:00:00"), // Month long event series
    deadline: new Date("2026-05-20T00:00:00"),
    quantity: 100,
    appliedCount: 45,
    poster:
      "https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=800&auto=format&fit=crop&q=60",
    urgent: true,
    status: "RECRUITING",
    views: 2100,
    requirements: [
      "Ưu tiên các bạn sinh sống tại Đà Nẵng",
      "Có phương tiện đi lại",
    ],
  },
  // PAST EVENTS - Already occurred
  {
    _id: new mongoose.Types.ObjectId("65e000000000000000000001"),
    btcId: users[0]._id,
    title: "Lễ hội Âm nhạc Countdown 2025",
    description:
      "Đại nhạc hội chào đón năm mới 2025 với sự góp mặt của nhiều nghệ sĩ nổi tiếng.",
    location: "Công viên Văn hóa Đầm Sen, TP. Hồ Chí Minh",
    eventType: "Festival",
    salary: "600.000 VNĐ/ca",
    benefits: "Bao ăn, áo đồng phục, xem show miễn phí",
    startTime: new Date("2024-12-31T18:00:00"),
    endTime: new Date("2025-01-01T01:00:00"),
    deadline: new Date("2024-12-20T00:00:00"),
    quantity: 40,
    appliedCount: 40,
    poster:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&auto=format&fit=crop&q=60",
    urgent: false,
    status: "COMPLETED",
    views: 3200,
    requirements: ["Có sức khỏe tốt", "Có thể làm ca đêm"],
  },
  {
    _id: new mongoose.Types.ObjectId("65e000000000000000000002"),
    btcId: users[1]._id,
    title: "Hội thảo Khởi nghiệp Startup Vietnam 2024",
    description:
      "Sự kiện hội thảo về khởi nghiệp với sự tham gia của các CEO và nhà đầu tư hàng đầu.",
    location: "Trung tâm Hội nghị Quốc gia, Hà Nội",
    eventType: "Conference",
    salary: "400.000 VNĐ/ngày",
    benefits: "Networking, chứng nhận tham gia",
    startTime: new Date("2024-11-15T08:00:00"),
    endTime: new Date("2024-11-15T17:00:00"),
    deadline: new Date("2024-11-01T00:00:00"),
    quantity: 15,
    appliedCount: 15,
    poster:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60",
    urgent: false,
    status: "COMPLETED",
    views: 890,
    requirements: ["Tiếng Anh giao tiếp", "Trang phục lịch sự"],
  },
  {
    _id: new mongoose.Types.ObjectId("65e000000000000000000003"),
    btcId: users[0]._id,
    title: "Marathon TP.HCM 2024",
    description:
      "Hỗ trợ tổ chức giải chạy marathon quốc tế với hàng ngàn VĐV tham gia.",
    location: "Trung tâm TP. Hồ Chí Minh",
    eventType: "Sports",
    salary: "350.000 VNĐ/ca",
    benefits: "Áo thun, mũ, nước uống, ăn trưa",
    startTime: new Date("2024-10-20T05:00:00"),
    endTime: new Date("2024-10-20T12:00:00"),
    deadline: new Date("2024-10-10T00:00:00"),
    quantity: 80,
    appliedCount: 80,
    poster:
      "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800&auto=format&fit=crop&q=60",
    urgent: false,
    status: "COMPLETED",
    views: 2500,
    requirements: ["Sức khỏe tốt", "Có thể làm việc sớm"],
  },
  {
    _id: new mongoose.Types.ObjectId("65e000000000000000000004"),
    btcId: users[1]._id,
    title: "Triển lãm Ô tô Việt Nam 2024",
    description:
      "PG/PB tại gian hàng các hãng xe hơi cao cấp, tư vấn khách hàng.",
    location: "Trung tâm Triển lãm SECC, TP. Hồ Chí Minh",
    eventType: "Exhibition",
    salary: "900.000 VNĐ/ngày",
    benefits: "Hoa hồng bán hàng, trang điểm miễn phí",
    startTime: new Date("2024-09-10T09:00:00"),
    endTime: new Date("2024-09-13T18:00:00"),
    deadline: new Date("2024-08-25T00:00:00"),
    quantity: 25,
    appliedCount: 25,
    poster:
      "https://images.unsplash.com/photo-1485463611174-f302f6a5c1c9?w=800&auto=format&fit=crop&q=60",
    urgent: false,
    status: "COMPLETED",
    views: 1800,
    requirements: ["Ngoại hình khá", "Kinh nghiệm PG/PB"],
  },
  // More past events for ctv1 history
  {
    _id: new mongoose.Types.ObjectId("65e000000000000000000005"),
    btcId: users[0]._id,
    title: "Lễ hội Bia Sài Gòn 2024",
    description:
      "Hỗ trợ booth trưng bày, phát sample và hướng dẫn khách tham quan.",
    location: "Nhà Văn hóa Thanh Niên, TP. Hồ Chí Minh",
    eventType: "Festival",
    salary: "450.000 VNĐ/ca",
    benefits: "Bia miễn phí, đồng phục, ăn tối",
    startTime: new Date("2024-08-15T17:00:00"),
    endTime: new Date("2024-08-15T23:00:00"),
    deadline: new Date("2024-08-01T00:00:00"),
    quantity: 30,
    appliedCount: 30,
    poster:
      "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&auto=format&fit=crop&q=60",
    urgent: false,
    status: "COMPLETED",
    views: 1500,
    requirements: ["Trên 18 tuổi", "Ngoại hình sáng"],
  },
  {
    _id: new mongoose.Types.ObjectId("65e000000000000000000006"),
    btcId: users[1]._id,
    title: "Concert Mỹ Tâm - Tri Ân 2024",
    description:
      "Hỗ trợ check-in, hướng dẫn khán giả và an ninh khu vực khán đài.",
    location: "Sân vận động Mỹ Đình, Hà Nội",
    eventType: "Concert",
    salary: "500.000 VNĐ/ca",
    benefits: "Xem show miễn phí, áo concert",
    startTime: new Date("2024-07-20T18:00:00"),
    endTime: new Date("2024-07-20T23:00:00"),
    deadline: new Date("2024-07-10T00:00:00"),
    quantity: 50,
    appliedCount: 50,
    poster:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop&q=60",
    urgent: false,
    status: "COMPLETED",
    views: 4500,
    requirements: ["Có sức khỏe tốt", "Có thể làm ca tối"],
  },
  {
    _id: new mongoose.Types.ObjectId("65e000000000000000000007"),
    btcId: users[0]._id,
    title: "Hội chợ Việc làm 2024",
    description:
      "Hướng dẫn sinh viên, hỗ trợ các gian hàng tuyển dụng của doanh nghiệp.",
    location: "Đại học Bách khoa TP.HCM",
    eventType: "Exhibition",
    salary: "200.000 VNĐ/buổi",
    benefits: "Cơ hội networking với các nhà tuyển dụng",
    startTime: new Date("2024-06-05T08:00:00"),
    endTime: new Date("2024-06-05T17:00:00"),
    deadline: new Date("2024-05-25T00:00:00"),
    quantity: 20,
    appliedCount: 20,
    poster:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&auto=format&fit=crop&q=60",
    urgent: false,
    status: "COMPLETED",
    views: 980,
    requirements: ["Sinh viên năm 3-4", "Giao tiếp tốt"],
  },
  {
    _id: new mongoose.Types.ObjectId("65e000000000000000000008"),
    btcId: users[1]._id,
    title: "Giải Bóng đá Sinh viên Hà Nội 2024",
    description:
      "Hỗ trợ công tác tổ chức giải đấu, điều phối cầu thủ và khán giả.",
    location: "Sân vận động Hàng Đẫy, Hà Nội",
    eventType: "Sports",
    salary: "250.000 VNĐ/trận",
    benefits: "Áo thun, nước uống, ăn nhẹ",
    startTime: new Date("2024-05-12T14:00:00"),
    endTime: new Date("2024-05-12T18:00:00"),
    deadline: new Date("2024-05-01T00:00:00"),
    quantity: 15,
    appliedCount: 15,
    poster:
      "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&auto=format&fit=crop&q=60",
    urgent: false,
    status: "COMPLETED",
    views: 650,
    requirements: ["Yêu thích bóng đá", "Nhanh nhẹn"],
  },
  {
    _id: new mongoose.Types.ObjectId("65e000000000000000000009"),
    btcId: users[0]._id,
    title: "Workshop Nhiếp ảnh Sáng tạo 2024",
    description:
      "Hỗ trợ setup thiết bị, chuẩn bị tài liệu và hướng dẫn học viên.",
    location: "Trung tâm Văn hóa Pháp, TP. Hồ Chí Minh",
    eventType: "Workshop",
    salary: "180.000 VNĐ/buổi",
    benefits: "Được học miễn phí, chứng chỉ tham gia",
    startTime: new Date("2024-04-20T09:00:00"),
    endTime: new Date("2024-04-20T16:00:00"),
    deadline: new Date("2024-04-10T00:00:00"),
    quantity: 10,
    appliedCount: 10,
    poster:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=60",
    urgent: false,
    status: "COMPLETED",
    views: 420,
    requirements: ["Có máy ảnh", "Yêu thích nhiếp ảnh"],
  },
  {
    _id: new mongoose.Types.ObjectId("65e000000000000000000010"),
    btcId: users[0]._id,
    title: "Đại nhạc hội Tiger Remix 2024",
    description:
      "Cần tuyển CTV check-in, soát vé, và hướng dẫn khán giả. Quy mô lớn với nhiều nghệ sĩ.",
    location: "Phố đi bộ Nguyễn Huệ, TP. Hồ Chí Minh",
    eventType: "Festival",
    salary: "550.000 VNĐ/ca",
    benefits: "Xem show miễn phí, đồng phục, ăn uống",
    startTime: new Date("2024-03-15T18:00:00"),
    endTime: new Date("2024-03-16T00:00:00"),
    deadline: new Date("2024-03-01T00:00:00"),
    quantity: 60,
    appliedCount: 60,
    poster:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60",
    urgent: false,
    status: "COMPLETED",
    views: 5200,
    requirements: ["Có sức khỏe tốt", "Nhiệt tình, năng động"],
  },
];

const applications = [
  // ===== CTV1 (ctv1@eventup.vn) - COMPLETED EVENTS =====
  {
    ctvId: users[2]._id,
    eventId: new mongoose.Types.ObjectId("65e000000000000000000001"), // Countdown 2025
    status: "COMPLETED",
    coverLetter: "Có kinh nghiệm làm sự kiện countdown trước đó",
    assignedRole: "Check-in Staff",
    createdAt: new Date("2024-12-15T10:00:00"),
  },
  {
    ctvId: users[2]._id,
    eventId: new mongoose.Types.ObjectId("65e000000000000000000003"), // Marathon 2024
    status: "COMPLETED",
    coverLetter: "Nhiệt tình, nhanh nhẹn, có kinh nghiệm chạy bộ",
    assignedRole: "Water Station Support",
    createdAt: new Date("2024-10-05T14:30:00"),
  },
  {
    ctvId: users[2]._id,
    eventId: new mongoose.Types.ObjectId("65e000000000000000000005"), // Lễ hội Bia
    status: "COMPLETED",
    coverLetter: "Đã từng làm PG cho nhiều sự kiện đồ uống",
    assignedRole: "Booth Support",
    createdAt: new Date("2024-08-01T09:00:00"),
  },
  {
    ctvId: users[2]._id,
    eventId: new mongoose.Types.ObjectId("65e000000000000000000006"), // Concert Mỹ Tâm
    status: "COMPLETED",
    coverLetter: "Fan cuồng Mỹ Tâm, rất muốn được tham gia hỗ trợ",
    assignedRole: "Usher",
    createdAt: new Date("2024-07-05T11:00:00"),
  },
  {
    ctvId: users[2]._id,
    eventId: new mongoose.Types.ObjectId("65e000000000000000000007"), // Hội chợ Việc làm
    status: "COMPLETED",
    coverLetter: "Sinh viên năm cuối Bách khoa, muốn hỗ trợ và networking",
    assignedRole: "Guide",
    createdAt: new Date("2024-05-20T08:00:00"),
  },
  {
    ctvId: users[2]._id,
    eventId: new mongoose.Types.ObjectId("65e000000000000000000009"), // Workshop Nhiếp ảnh
    status: "COMPLETED",
    coverLetter: "Đam mê nhiếp ảnh, muốn được học hỏi thêm",
    assignedRole: "Assistant",
    createdAt: new Date("2024-04-05T10:00:00"),
  },
  {
    ctvId: users[2]._id,
    eventId: new mongoose.Types.ObjectId("65e000000000000000000010"), // Tiger Remix
    status: "COMPLETED",
    coverLetter: "Có kinh nghiệm từ nhiều sự kiện âm nhạc lớn",
    assignedRole: "Check-in Lead",
    createdAt: new Date("2024-03-01T09:00:00"),
  },

  // ===== CTV1 - CURRENT/FUTURE EVENTS =====
  {
    ctvId: users[2]._id,
    eventId: new mongoose.Types.ObjectId("65d000000000000000000001"), // EDM Ravolution
    status: "PENDING",
    coverLetter:
      "Đã tham gia nhiều sự kiện âm nhạc, rất muốn được hỗ trợ Ravolution",
    createdAt: new Date("2026-04-25T16:20:00"),
  },
  {
    ctvId: users[2]._id,
    eventId: new mongoose.Types.ObjectId("65d000000000000000000003"), // Auto Expo
    status: "PENDING",
    coverLetter: "Có kinh nghiệm làm PG tại các sự kiện xe hơi",
    createdAt: new Date("2026-04-05T09:00:00"),
  },
  {
    ctvId: users[2]._id,
    eventId: new mongoose.Types.ObjectId("65d000000000000000000002"), // Tech Summit
    status: "PENDING",
    coverLetter: "Có kinh nghiệm hỗ trợ hội thảo công nghệ",
    createdAt: new Date("2026-05-20T09:00:00"),
  },

  // ===== CTV2 (ctv2@eventup.vn) =====
  {
    ctvId: users[3]._id,
    eventId: new mongoose.Types.ObjectId("65e000000000000000000002"), // Startup Vietnam
    status: "COMPLETED",
    coverLetter: "MC sự kiện, tiếng Anh giao tiếp tốt",
    assignedRole: "MC Support",
    createdAt: new Date("2024-10-28T09:00:00"),
  },
  {
    ctvId: users[3]._id,
    eventId: new mongoose.Types.ObjectId("65e000000000000000000006"), // Concert Mỹ Tâm
    status: "COMPLETED",
    coverLetter: "Kinh nghiệm hỗ trợ nhiều show ca nhạc lớn",
    assignedRole: "VIP Usher",
    createdAt: new Date("2024-07-08T14:00:00"),
  },
  {
    ctvId: users[3]._id,
    eventId: new mongoose.Types.ObjectId("65d000000000000000000003"), // Auto Expo
    status: "PENDING",
    coverLetter: "MC và giao tiếp tiếng Anh tốt",
    createdAt: new Date("2026-04-05T10:30:00"),
  },
  {
    ctvId: users[3]._id,
    eventId: new mongoose.Types.ObjectId("65d000000000000000000002"), // Tech Summit
    status: "APPROVED",
    coverLetter: "Tiếng Anh giao tiếp tốt, đã từng làm MC cho nhiều hội thảo",
    assignedRole: "Mic Runner",
    createdAt: new Date("2026-05-20T10:00:00"),
  },

  // ===== CTV3 (ctv3@eventup.vn) =====
  {
    ctvId: users[4]._id,
    eventId: new mongoose.Types.ObjectId("65e000000000000000000003"), // Marathon 2024
    status: "COMPLETED",
    coverLetter: "Yêu thích thể thao, đã từng chạy marathon",
    assignedRole: "Route Marshal",
    createdAt: new Date("2024-10-08T07:00:00"),
  },
  {
    ctvId: users[4]._id,
    eventId: new mongoose.Types.ObjectId("65e000000000000000000008"), // Bóng đá Sinh viên
    status: "COMPLETED",
    coverLetter: "Cầu thủ nghiệp dư, am hiểu luật bóng đá",
    assignedRole: "Ball Boy Coordinator",
    createdAt: new Date("2024-05-02T10:00:00"),
  },
  {
    ctvId: users[4]._id,
    eventId: new mongoose.Types.ObjectId("65d000000000000000000003"), // Auto Expo
    status: "APPROVED",
    coverLetter: "Đã từng hỗ trợ Marathon Đà Nẵng, sức khỏe tốt",
    assignedRole: "PG",
    createdAt: new Date("2026-04-05T11:00:00"),
  },
  {
    ctvId: users[4]._id,
    eventId: new mongoose.Types.ObjectId("65d000000000000000000002"), // Tech Summit
    status: "PENDING",
    coverLetter: "Sẵn sàng hỗ trợ các công việc hậu cần",
    createdAt: new Date("2026-05-21T14:00:00"),
  },

  // ===== Additional applications for event variety =====
  {
    ctvId: users[3]._id,
    eventId: new mongoose.Types.ObjectId("65e000000000000000000004"), // Triển lãm Ô tô 2024
    status: "COMPLETED",
    coverLetter: "Kinh nghiệm PG xe hơi cao cấp",
    assignedRole: "VIP Host",
    createdAt: new Date("2024-08-20T09:00:00"),
  },
  {
    ctvId: users[4]._id,
    eventId: new mongoose.Types.ObjectId("65e000000000000000000005"), // Lễ hội Bia
    status: "COMPLETED",
    coverLetter: "Sức khỏe tốt, có thể bê vác",
    assignedRole: "Logistics Support",
    createdAt: new Date("2024-08-02T08:00:00"),
  },
];

const importData = async () => {
  try {
    // Hash passwords
    for (const user of users) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash("123456", salt);
    }

    // Clear DB
    await User.deleteMany();
    await BTCProfile.deleteMany();
    await CTVProfile.deleteMany();
    await Event.deleteMany();
    await Application.deleteMany();
    // await Notification.deleteMany();

    console.log("Existing data cleared.");

    // Import Data
    await User.insertMany(users);
    await BTCProfile.insertMany(btcProfiles);
    await CTVProfile.insertMany(ctvProfiles);
    await Event.insertMany(events);
    await Application.insertMany(applications);

    console.log("Data Imported Successfully!");
    process.exit();
  } catch (error) {
    console.error("Error importing data:", error);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await User.deleteMany();
    await BTCProfile.deleteMany();
    await CTVProfile.deleteMany();
    await Event.deleteMany();
    await Application.deleteMany();
    // await Notification.deleteMany();

    console.log("Data Destroyed!");
    process.exit();
  } catch (error) {
    console.error("Error destroying data:", error);
    process.exit(1);
  }
};

if (process.argv[2] === "--destroy") {
  destroyData();
} else if (process.argv[2] === "--import") {
  importData();
} else {
  console.log("Please run with argument: --import or --destroy");
  process.exit();
}
