const {
  Review,
  Event,
  Application,
  BTCProfile,
  CTVProfile,
} = require("../models");

// @desc    CTV review BTC
// @route   POST /api/reviews/btc
// @access  Private (CTV)
exports.reviewBTC = async (req, res, next) => {
  try {
    const { eventId, rating, comment } = req.body;
    const ctvId = req.user._id;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if CTV participated in the event
    const application = await Application.findOne({
      eventId,
      ctvId,
      status: "COMPLETED",
    });

    if (!application) {
      return res.status(403).json({
        success: false,
        message: "You can only review events you have completed",
      });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({
      eventId,
      fromUser: ctvId,
      toUser: event.btcId,
      reviewType: "CTV_TO_BTC",
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this BTC for this event",
      });
    }

    // Create review
    const review = await Review.create({
      eventId,
      fromUser: ctvId,
      toUser: event.btcId,
      reviewType: "CTV_TO_BTC",
      rating,
      comment,
    });

    // Update BTC rating
    const btcProfile = await BTCProfile.findOne({ userId: event.btcId });
    if (btcProfile) {
      btcProfile.updateRating(rating);
      await btcProfile.save();
    }

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    BTC review CTV
// @route   POST /api/reviews/ctv
// @access  Private (BTC)
exports.reviewCTV = async (req, res, next) => {
  try {
    const { eventId, ctvId, skill, attitude, comment } = req.body;
    const btcId = req.user._id;

    // Check if event exists and belongs to BTC
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (event.btcId.toString() !== btcId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to review for this event",
      });
    }

    // Check if CTV participated
    const application = await Application.findOne({
      eventId,
      ctvId,
      status: "COMPLETED",
    });

    if (!application) {
      return res.status(400).json({
        success: false,
        message: "CTV did not complete this event",
      });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({
      eventId,
      fromUser: btcId,
      toUser: ctvId,
      reviewType: "BTC_TO_CTV",
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this CTV for this event",
      });
    }

    // Create review
    const review = await Review.create({
      eventId,
      fromUser: btcId,
      toUser: ctvId,
      reviewType: "BTC_TO_CTV",
      skill,
      attitude,
      comment,
    });

    // Update CTV reputation
    const ctvProfile = await CTVProfile.findOne({ userId: ctvId });
    if (ctvProfile) {
      const avgRating = (skill + attitude) / 2;
      ctvProfile.updateReputation(avgRating);

      // Update Trust Score: -2 if rating is poor (< 3)
      if (avgRating < 3) {
        ctvProfile.updateTrustScore(-2);
      }

      await ctvProfile.save();
    }

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a user
// @route   GET /api/reviews/user/:userId
// @access  Public
exports.getUserReviews = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ toUser: userId })
      .populate("fromUser", "email role")
      .populate("eventId", "title eventType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ toUser: userId });

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};
