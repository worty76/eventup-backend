require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const { reviewBTC } = require("../controllers/reviewController");
const { User, Event, Application, Notification, Review } = require("../models");

// Mock Express Request/Response
const mockReq = (body, user) => ({
  body,
  user,
  app: {
    get: (key) => {
      if (key === "io")
        return {
          to: () => ({
            emit: (ev, data) =>
              console.log(`[Socket Mock] Emitted ${ev}:`, data.title),
          }),
        };
    },
  },
});

const mockRes = () => {
  const res = {};
  res.status = (code) => {
    console.log(`[Response Status] ${code}`);
    return res;
  };
  res.json = (data) => {
    console.log("[Response Data]", data);
    return res;
  };
  return res;
};

const mockNext = (err) => console.error("[Next Error]", err);

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log("Connected to DB");
  try {
    // 1. Setup Data
    const ctv = await User.create({
      email: `ctv_test_${Date.now()}@test.com`,
      role: "CTV",
      status: "ACTIVE",
    });
    const btc = await User.create({
      email: `btc_test_${Date.now()}@test.com`,
      role: "BTC",
      status: "ACTIVE",
    });

    const event = await Event.create({
      title: "Test Review Notification Event",
      btcId: btc._id,
      startTime: new Date(Date.now() + 3600000), // +1 hour
      endTime: new Date(Date.now() + 7200000), // +2 hours
      deadline: new Date(), // Now
      eventType: "Workshop",
      location: "Test Loc",
      salary: "1M",
      description: "Test Description",
      quantity: 10,
    });

    await Application.create({
      eventId: event._id,
      ctvId: ctv._id,
      status: "COMPLETED",
    });

    console.log("Setup Complete. Sending Review...");

    // 2. Trigger Controller
    await reviewBTC(
      mockReq({ eventId: event._id, rating: 5, comment: "Great event!" }, ctv),
      mockRes(),
      mockNext,
    );

    // 3. Verify Notification
    const notif = await Notification.findOne({
      userId: btc._id,
      type: "REVIEW",
    });
    if (notif) {
      console.log("✅ SUCCESS: Notification created for BTC");
      console.log("Title:", notif.title);
    } else {
      console.error("❌ FAILED: No notification found for BTC");
    }
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
});
