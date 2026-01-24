require("dotenv").config();
const mongoose = require("mongoose");
const {
  checkReviewStatus,
  updateReview,
  deleteReview,
  reviewBTC,
} = require("../controllers/reviewController");
const {
  User,
  Event,
  Application,
  Review,
  BTCProfile,
  CTVProfile,
} = require("../models");

// Mock Express Objects
const mockReq = (body = {}, params = {}, query = {}, user = {}) => ({
  body,
  params,
  query,
  user,
});

const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.data = data;
    return res;
  };
  return res;
};

const mockNext = (err) => {
  if (err) console.error("NEXT ERROR:", err);
};

// Connect to DB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB for testing Review CRUD");
    runTest();
  })
  .catch((err) => {
    console.error("DB Connection Error:", err);
    process.exit(1);
  });

const runTest = async () => {
  try {
    // 1. Setup Data
    const ctvUser = await User.create({
      fullName: "Test Review CTV",
      email: `test_review_ctv_${Date.now()}@test.com`,
      password: "password123",
      role: "CTV",
      status: "ACTIVE",
    });

    const btcUser = await User.create({
      fullName: "Test Review BTC",
      email: `test_review_btc_${Date.now()}@test.com`,
      password: "password123",
      role: "BTC",
      status: "ACTIVE",
    });

    await BTCProfile.create({
      userId: btcUser._id,
      agencyName: "Test Agency",
      rating: { average: 5, totalReviews: 1 }, // Start with 5.0 (1 review)
    });

    const event = await Event.create({
      btcId: btcUser._id,
      title: "Test Event Review",
      description: "Test",
      location: "Online",
      startTime: new Date(Date.now() - 10000), // Started 10s ago
      endTime: new Date(), // Ended now
      deadline: new Date(Date.now() - 20000), // Deadline 20s ago
      salary: "100k",
      eventType: "Workshop",
      quantity: 5,
      status: "COMPLETED",
    });

    await Application.create({
      eventId: event._id,
      ctvId: ctvUser._id,
      status: "COMPLETED",
      coverLetter: "Test",
    });

    console.log("setup completed");

    // 2. Create Review (CTV -> BTC)
    // Old implementation
    await Review.create({
      eventId: event._id,
      fromUser: ctvUser._id,
      toUser: btcUser._id,
      reviewType: "CTV_TO_BTC",
      rating: 4,
      comment: "Good",
    });
    // Update profile manually for setup
    const btcProfile = await BTCProfile.findOne({ userId: btcUser._id });
    btcProfile.updateRating(4); // New avg: (5*1 + 4)/2 = 4.5
    await btcProfile.save();

    console.log(
      "Created review. Profile Avg (Expected 4.5):",
      btcProfile.rating.average,
    );

    // 3. Test Check Status
    const checkReq = mockReq(
      {},
      {},
      {
        eventId: event._id.toString(),
        toUserId: btcUser._id.toString(),
        reviewType: "CTV_TO_BTC",
      },
      ctvUser,
    );
    const checkRes = mockRes();

    await checkReviewStatus(checkReq, checkRes, mockNext);

    if (checkRes.data.success && checkRes.data.hasReviewed) {
      console.log("✅ Check Review Passed");
    } else {
      console.log("❌ Check Review Failed", checkRes.data);
    }

    const reviewId = checkRes.data.review._id;

    // 4. Test Update Review (Change 4 -> 2)
    const updateReq = mockReq(
      { rating: 2, comment: "Bad" },
      { id: reviewId },
      {},
      ctvUser,
    );
    const updateRes = mockRes();

    await updateReview(updateReq, updateRes, mockNext);

    // Verify
    const updatedProfile = await BTCProfile.findOne({ userId: btcUser._id });
    // Old Total: 4.5 * 2 = 9
    // Remove 4: 9 - 4 = 5
    // Add 2: 5 + 2 = 7
    // New Avg: 7 / 2 = 3.5
    console.log(
      "Updated Profile Avg (Expected 3.5):",
      updatedProfile.rating.average,
    );

    if (
      updatedProfile.rating.average === 3.5 &&
      updateRes.data.data.rating === 2
    ) {
      console.log("✅ Update Review Passed");
    } else {
      console.log("❌ Update Review Failed");
    }

    // 5. Test Delete Review
    const deleteReq = mockReq({}, { id: reviewId }, {}, ctvUser);
    const deleteRes = mockRes();

    await deleteReview(deleteReq, deleteRes, mockNext);

    // Verify
    const deletedReview = await Review.findById(reviewId);
    if (!deletedReview) {
      const finalProfile = await BTCProfile.findOne({ userId: btcUser._id });
      // Restore:
      // Current Total: 3.5 * 2 = 7
      // Remove 2: 7 - 2 = 5
      // New Total Reviews: 1
      // New Avg: 5 / 1 = 5
      console.log(
        "Final Profile Avg (Expected 5):",
        finalProfile.rating.average,
      );
      if (finalProfile.rating.average === 5) {
        console.log("✅ Delete Review Passed");
      } else {
        console.log("❌ Delete Review Profile Revert Failed");
      }
    } else {
      console.log("❌ Delete Review Failed (Review still exists)");
    }
  } catch (error) {
    console.error("Test Error:", error);
  } finally {
    mongoose.connection.close();
  }
};
