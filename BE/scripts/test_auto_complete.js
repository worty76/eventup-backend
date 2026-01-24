const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { User, Event, Application, CTVProfile } = require("../models");
const { autoCompleteEvents } = require("../controllers/applicationController");

const runTest = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected.");

    // 1. Create Test Users
    console.log("Creating/Finding test users...");

    // BTC
    let btc = await User.findOne({ email: "test_btc_seed@example.com" });
    if (!btc) {
      btc = await User.create({
        email: "test_btc_seed@example.com",
        passwordHash:
          "$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // dummy hash
        role: "BTC",
        status: "ACTIVE",
        companyName: "Test Company",
      });
      console.log("BTC User created:", btc._id);
    } else {
      console.log("BTC User found:", btc._id);
    }

    // CTV
    let ctv = await User.findOne({ email: "test_ctv_seed@example.com" });
    if (!ctv) {
      ctv = await User.create({
        email: "test_ctv_seed@example.com",
        passwordHash:
          "$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        role: "CTV",
        status: "ACTIVE",
        fullName: "Test CTV",
      });
      console.log("CTV User created:", ctv._id);
    } else {
      console.log("CTV User found:", ctv._id);
    }

    // CTV Profile
    let ctvProfile = await CTVProfile.findOne({ userId: ctv._id });
    if (!ctvProfile) {
      ctvProfile = await CTVProfile.create({
        userId: ctv._id,
        fullName: "Test CTV",
        trustScore: 5, // Start with < 10 to test increment
        reputation: { score: 5, totalReviews: 1 },
      });
      console.log("CTV Profile created.");
    } else {
      ctvProfile.trustScore = 5;
      await ctvProfile.save();
      console.log("CTV Profile trust score reset to 5.");
    }

    const initialTrustScore = ctvProfile.trustScore;
    console.log("Initial Trust Score:", initialTrustScore);

    // 2. Create Test Event (Ended 4 days ago)
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    const startTime = new Date(fourDaysAgo);
    startTime.setHours(startTime.getHours() - 2);

    const deadline = new Date(startTime);
    deadline.setDate(deadline.getDate() - 1);

    const event = await Event.create({
      btcId: btc._id,
      title: "Test Auto Complete Event " + Date.now(),
      description: "This event should be auto completed",
      location: "Hanoi",
      eventType: "Other",
      salary: "100k",
      startTime: startTime,
      endTime: fourDaysAgo,
      deadline: deadline,
      quantity: 5,
      status: "COMPLETED", // Logically it ended
    });
    console.log("Event created:", event._id);

    // 3. Create Application (APPROVED)
    const application = await Application.create({
      eventId: event._id,
      ctvId: ctv._id,
      status: "APPROVED",
      coverLetter: "I want to join",
    });
    console.log(
      "Application created:",
      application._id,
      "Status:",
      application.status,
    );

    // 4. Run Auto Complete
    console.log("Running autoCompleteEvents...");
    const updatedCount = await autoCompleteEvents();
    console.log("Updated count:", updatedCount);

    // 5. Verify
    const updatedApplication = await Application.findById(application._id);
    console.log("Updated Application Status:", updatedApplication.status);

    const updatedProfile = await CTVProfile.findOne({ userId: ctv._id });
    console.log("Updated Trust Score:", updatedProfile.trustScore);

    if (
      updatedApplication.status === "COMPLETED" &&
      updatedProfile.trustScore === initialTrustScore + 1
    ) {
      console.log("✅ TEST PASSED");
    } else {
      console.log("❌ TEST FAILED");
      console.log(
        "Expected Status: COMPLETED, Got:",
        updatedApplication.status,
      );
      console.log(
        "Expected Trust Score:",
        initialTrustScore + 1,
        "Got:",
        updatedProfile.trustScore,
      );
    }
  } catch (error) {
    console.error("Error running test:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
};

runTest();
