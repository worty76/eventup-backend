require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const {
  sendPreEventReminders,
} = require("../controllers/applicationController");
const { User, Event, Application, Notification } = require("../models");

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log("Connected to DB");
  try {
    // 1. Setup Data: Event starting in 24h + 1min
    const now = new Date();
    const startTime = new Date(
      now.getTime() + 24 * 60 * 60 * 1000 + 1 * 60 * 1000,
    ); // 24h 1m from now

    const btc = await User.create({
      email: `btc_remind_${Date.now()}@test.com`,
      role: "BTC",
      status: "ACTIVE",
    });
    const ctv = await User.create({
      email: `ctv_remind_${Date.now()}@test.com`,
      role: "CTV",
      status: "ACTIVE",
    });

    const event = await Event.create({
      title: "Test Reminder Event",
      btcId: btc._id,
      startTime,
      endTime: new Date(startTime.getTime() + 3600000),
      eventType: "Workshop",
      location: "Test Loc",
      salary: "1M",
      status: "RECRUITING",
      deadline: new Date(),
      description: "Test Description",
      quantity: 10,
    });

    await Application.create({
      eventId: event._id,
      ctvId: ctv._id,
      status: "APPROVED",
    });

    console.log("Setup Complete. Event Start Time:", startTime);
    console.log("Running sendPreEventReminders...");

    // 2. Run Function
    const count = await sendPreEventReminders();
    console.log(`Processed count: ${count}`);

    // 3. Verify Notification
    const btcNotif = await Notification.findOne({
      userId: btc._id,
      type: "REMINDER",
      relatedId: event._id,
    });
    const ctvNotif = await Notification.findOne({
      userId: ctv._id,
      type: "REMINDER",
      relatedId: event._id,
    });

    if (btcNotif) console.log("✅ SUCCESS: BTC Notification found");
    else console.error("❌ FAILED: BTC Notification missing");

    if (ctvNotif) console.log("✅ SUCCESS: CTV Notification found");
    else console.error("❌ FAILED: CTV Notification missing");
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
});
