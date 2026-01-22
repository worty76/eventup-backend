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

const events = [
  {
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
    // await Application.deleteMany();
    // await Notification.deleteMany();

    console.log("Existing data cleared.");

    // Import Data
    await User.insertMany(users);
    await BTCProfile.insertMany(btcProfiles);
    await CTVProfile.insertMany(ctvProfiles);
    await Event.insertMany(events);

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
    // await Application.deleteMany();
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
