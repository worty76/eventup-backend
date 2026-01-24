require("dotenv").config();
const mongoose = require("mongoose");
const {
  sendCompletionReminders,
} = require("../controllers/applicationController");
const {
  User,
  Event,
  Application,
  Notification,
  CTVProfile,
  BTCProfile,
} = require("../models");

// Connect to DB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB for testing reminders");
    runTest();
  })
  .catch((err) => {
    console.error("DB Connection Error:", err);
    process.exit(1);
  });

const runTest = async () => {
  try {
    // 1. Create Users
    const btc = await User.create({
      fullName: "Test Reminder BTC",
      email: `test_reminder_btc_${Date.now()}@test.com`,
      password: "password123",
      role: "BTC",
      status: "ACTIVE",
    });

    const ctv = await User.create({
      fullName: "Test Reminder CTV",
      email: `test_reminder_ctv_${Date.now()}@test.com`,
      password: "password123",
      role: "CTV",
      status: "ACTIVE",
    });

    // Create Profiles (minimal needed)
    await BTCProfile.create({ userId: btc._id, agencyName: "Test Company" });
    await CTVProfile.create({
      userId: ctv._id,
      fullName: "Test CTV",
      contactPhone: "0123456789",
    });

    // 2. Create Event ending 24.5 hours ago
    const twentyFourHoursThirtyMinutesAgo = new Date();
    twentyFourHoursThirtyMinutesAgo.setHours(
      twentyFourHoursThirtyMinutesAgo.getHours() - 24,
    );
    twentyFourHoursThirtyMinutesAgo.setMinutes(
      twentyFourHoursThirtyMinutesAgo.getMinutes() - 30,
    );

    const event = await Event.create({
      btcId: btc._id,
      title: "Test Event for Reminder",
      description: "Testing reminder logic",
      location: "Online",
      startTime: new Date(twentyFourHoursThirtyMinutesAgo.getTime() - 3600000), // Started 1 hour before end
      endTime: twentyFourHoursThirtyMinutesAgo,
      deadline: new Date(twentyFourHoursThirtyMinutesAgo.getTime() - 7200000), // Deadline before start
      salary: "100k",
      status: "COMPLETED", // Even if status is completed (or not), logic depends on end time.
      // Wait, usually status might be 'recruit_end' or similar?
      // Logic in sendCompletionReminders uses query on endTime only.
      // Actually, let's keep it realistic. If it ended, status usually isn't COMPLETED for the whole event yet?
      // The reminder is TO complete it.
      // Let's assume status is active or recruit_end.
      eventType: "Workshop",
      quantity: 10,
      maxApplications: 5,
    });

    // 3. Create Approved Application (trigger condition)
    await Application.create({
      eventId: event._id,
      ctvId: ctv._id,
      status: "APPROVED",
      coverLetter: "I want to join",
    });

    console.log("Setup complete. Event End Time:", event.endTime);
    console.log("Target window: 24h to 25h ago.");

    // 4. Run the function
    console.log("Running sendCompletionReminders...");
    const sentCount = await sendCompletionReminders();

    console.log(`Sent ${sentCount} reminders.`);

    // 5. Verify Notification
    const notification = await Notification.findOne({
      userId: btc._id,
      type: "REMINDER",
      relatedId: event._id,
    });

    if (notification) {
      console.log("✅ TEST PASSED: Reminder notification found.");
      console.log("Title:", notification.title);
      console.log("Content:", notification.content);
    } else {
      console.log("❌ TEST FAILED: No reminder notification found.");
    }
  } catch (error) {
    console.error("Test Error:", error);
  } finally {
    mongoose.connection.close();
  }
};
