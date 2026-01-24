const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const BTCProfile = require("./models/BTCProfile");
const CTVProfile = require("./models/CTVProfile");
const Event = require("./models/Event");
const Application = require("./models/Application");
const Notification = require("./models/Notification");
const Review = require("./models/Review");
const Payment = require("./models/Payment");

dotenv.config();

mongoose.connect(process.env.MONGODB_URI);

const importData = async () => {
  try {
    console.log("Clearing existing data...");
    await User.deleteMany();
    await BTCProfile.deleteMany();
    await CTVProfile.deleteMany();
    await Event.deleteMany();
    await Application.deleteMany();
    await Notification.deleteMany();
    await Review.deleteMany();
    await Payment.deleteMany();

    console.log("Data cleared. Starting seeding...");

    // Password hash
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("123456", salt);

    // 1. Create Users & Profiles
    const btcUsers = [];
    const btcProfiles = [];
    const ctvUsers = [];
    const ctvProfiles = [];

    // 10 BTC Users
    for (let i = 1; i <= 10; i++) {
      const userId = new mongoose.Types.ObjectId();
      btcUsers.push({
        _id: userId,
        email: `btc${i}@eventup.vn`,
        passwordHash,
        role: "BTC",
        phone: `0901${String(i).padStart(6, "0")}`,
        isEmailVerified: true,
        status: "ACTIVE",
        subscription: { plan: "PREMIUM", expiredAt: new Date("2026-12-31") },
      });

      btcProfiles.push({
        userId: userId,
        agencyName: `BTC Agency ${i}`,
        logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=500&auto=format&fit=crop&q=60",
        address: `Address BTC ${i}`,
        website: `https://btc${i}.com`,
        description: `Description for BTC Agency ${i}`,
        verified: i % 2 === 0, // Alternate verified status
        rating: { average: 4.5, totalReviews: i * 2 },
      });
    }

    // 10 CTV Users
    for (let i = 1; i <= 10; i++) {
      const userId = new mongoose.Types.ObjectId();
      ctvUsers.push({
        _id: userId,
        email: `ctv${i}@eventup.vn`,
        passwordHash,
        role: "CTV",
        phone: `0902${String(i).padStart(6, "0")}`,
        isEmailVerified: true,
        status: "ACTIVE",
      });

      ctvProfiles.push({
        userId: userId,
        fullName: `CTV User ${i}`,
        avatar:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500&auto=format&fit=crop&q=60",
        gender: i % 2 === 0 ? "MALE" : "FEMALE",
        address: `Address CTV ${i}`,
        skills: ["PG", "MC", "Check-in"],
        experiences: [`Experience ${i}`, `Experience ${i + 1}`],
        reputation: { score: Math.min(10, 8.0 + i * 0.1), totalReviews: i }, // Keep under 10
        trustScore: Math.min(10, 8 + i * 0.2), // Keep under 10
      });
    }

    await User.insertMany([...btcUsers, ...ctvUsers]);
    await BTCProfile.insertMany(btcProfiles);
    // await CTVProfile.insertMany(ctvProfiles); // Moved to after applications loop
    console.log("Users and BTC Profiles seeded.");

    // 2. Create 20 Events
    const events = [];
    for (let i = 1; i <= 20; i++) {
      const btcIndex = (i - 1) % 10; // Distribute among 10 BTCs
      const eventId = new mongoose.Types.ObjectId();

      // Random status logic
      let status = "RECRUITING";
      let startTime = new Date();
      startTime.setDate(startTime.getDate() + 10 + i);

      if (i > 15) {
        status = "COMPLETED"; // Last 5 events completed
        startTime = new Date();
        startTime.setDate(startTime.getDate() - 20 - i);
      }

      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 4);

      const deadline = new Date(startTime);
      deadline.setDate(deadline.getDate() - 5);

      events.push({
        _id: eventId,
        btcId: btcUsers[btcIndex]._id,
        title: `Event Title ${i}`,
        description: `This is description for event ${i}. We need staff for position X, Y, Z.`,
        location: `Location ${i}`,
        eventType: ["Conference", "Festival", "Workshop"][i % 3],
        salary: `${300 + i * 10}.000 VNĐ/ca`,
        benefits: "Meals, Certificate",
        startTime,
        endTime,
        deadline,
        quantity: 10 + i,
        appliedCount: 0, // Will update when creating applications
        poster:
          "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&auto=format&fit=crop&q=60",
        urgent: i % 5 === 0,
        status,
        views: 100 * i,
        requirements: ["Requirement 1", "Requirement 2"],
      });
    }

    // Insert events first to get IDs if needed, but we generated IDs manually
    await Event.insertMany(events);
    console.log("Events seeded.");

    // 3. Create 10 Applications
    const applications = [];
    const usedPairs = new Set();

    // For 10 applications, pick random CTV and Event
    // Ensure unique (ctvId, eventId)
    // Update event.appliedCount

    let appCount = 0;
    while (appCount < 10) {
      const ctvIndex = Math.floor(Math.random() * 10);
      const eventIndex = Math.floor(Math.random() * 20);
      const ctvId = ctvUsers[ctvIndex]._id;
      const eventId = events[eventIndex]._id;
      const pairKey = `${ctvId}-${eventId}`;

      if (!usedPairs.has(pairKey)) {
        usedPairs.add(pairKey);
        if (appCount % 4 === 1 || appCount % 4 === 3) {
          // Update CTV Profile with joined event
          const role = "Cộng tác viên";
          ctvProfiles[ctvIndex].joinedEvents =
            ctvProfiles[ctvIndex].joinedEvents || [];
          ctvProfiles[ctvIndex].joinedEvents.push({
            eventId: eventId,
            role: role,
            joinedAt: new Date(),
          });

          applications.push({
            eventId: eventId,
            ctvId: ctvId,
            coverLetter: `I am unmatched for this job ${appCount}`,
            status: "COMPLETED", // Assuming joined means completed or approved
            assignedRole: role,
            createdAt: new Date(),
          });
        } else {
          applications.push({
            eventId: eventId,
            ctvId: ctvId,
            coverLetter: `I am unmatched for this job ${appCount}`,
            status: ["PENDING", "REJECTED"][appCount % 2],
            assignedRole: null,
            createdAt: new Date(),
          });
        }

        events[eventIndex].appliedCount += 1;

        appCount++;
      }
    }

    // We need to update the CTVProfiles in DB because we initially inserted them without joinedEvents
    // Or simpler: Re-insert CTVProfiles?
    // We inserted `ctvProfiles` array at line 91.
    // We modified the array in memory `ctvProfiles[ctvIndex].joinedEvents...`.
    // BUT we already called `await CTVProfile.insertMany(ctvProfiles);` BEFORE this loop (line 91).
    // So modifying the array in memory won't change DB.
    // FIX: Move `CTVProfile.insertMany` to AFTER this loop.

    // Deleting the previous insert line and moving it here.
    await Application.insertMany(applications);
    await CTVProfile.insertMany(ctvProfiles); // Insert AFTER modifications

    // Update Event appliedCounts in DB
    for (const ev of events) {
      if (ev.appliedCount > 0) {
        await Event.findByIdAndUpdate(ev._id, {
          appliedCount: ev.appliedCount,
        });
      }
    }
    console.log("Applications seeded.");

    // 4. Create 10 Reviews
    // Reviews usually happen for COMPLETED applications/events
    const reviews = [];
    let reviewCount = 0;

    // Force create some reviews on random users.

    while (reviewCount < 10) {
      const ctvIndex = Math.floor(Math.random() * 10);
      const btcIndex = Math.floor(Math.random() * 10);
      const eventIndex = Math.floor(Math.random() * 20);

      // Review type switch
      const type = reviewCount % 2 === 0 ? "BTC_TO_CTV" : "CTV_TO_BTC";
      const fromUser =
        type === "BTC_TO_CTV" ? btcUsers[btcIndex]._id : ctvUsers[ctvIndex]._id;
      const toUser =
        type === "BTC_TO_CTV" ? ctvUsers[ctvIndex]._id : btcUsers[btcIndex]._id;

      reviews.push({
        eventId: events[eventIndex]._id, // Use random event ID to satisfy schema, potentially ignoring uniqueness constraint collision risk (low for 10)
        fromUser,
        toUser,
        reviewType: type,
        rating: 5,
        skill: 5,
        attitude: 5,
        comment: `Great job! Review number ${reviewCount}`,
      });
      reviewCount++;
    }

    // Insert with ordered false to ignore duplicates if any unique index collision happens
    try {
      await Review.insertMany(reviews, { ordered: false });
    } catch (e) {
      console.log("Some reviews might have been duplicates, ignored.");
    }
    console.log("Reviews seeded.");

    // 5. Create 10 Notifications
    const notifications = [];
    for (let i = 0; i < 10; i++) {
      notifications.push({
        userId: ctvUsers[i % 10]._id, // Send to CTVs
        type: "SYSTEM",
        title: `Notification ${i}`,
        content: `This is a system notification number ${i}`,
        isRead: false,
      });
    }
    await Notification.insertMany(notifications);
    console.log("Notifications seeded.");

    // 6. Create 10 Payments
    const payments = [];
    for (let i = 0; i < 10; i++) {
      // BTC paying
      payments.push({
        userId: btcUsers[i % 10]._id,
        amount: 500000,
        method: "VNPAY",
        status: "SUCCESS",
        description: `Payment for premium plan ${i}`,
        transactionId: `TRANS_${Date.now()}_${i}`,
        subscriptionData: {
          plan: "PREMIUM",
          duration: 30,
        },
      });
    }
    await Payment.insertMany(payments);
    console.log("Payments seeded.");

    console.log("ALL DATA IMPORTED SUCCESSFULLY!");
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
    await Notification.deleteMany();
    await Review.deleteMany();
    await Payment.deleteMany();

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
