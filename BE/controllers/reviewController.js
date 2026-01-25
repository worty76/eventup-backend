const {
  Review,
  Event,
  Application,
  BTCProfile,
  CTVProfile,
  Notification,
} = require("../models");
const emailService = require("../utils/email");

// @desc    CTV review BTC
// @route   POST /api/reviews/btc
// @access  Private (CTV)
exports.reviewBTC = async (req, res, next) => {
  try {
    const { eventId, rating, comment } = req.body;
    const ctvId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const application = await Application.findOne({
      eventId,
      ctvId,
      status: { $in: ["COMPLETED", "NO_SHOW"] },
    });

    if (!application) {
      return res.status(403).json({
        success: false,
        message: "You can only review events you have completed",
      });
    }

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

    
    const review = await Review.create({
      eventId,
      fromUser: ctvId,
      toUser: event.btcId,
      reviewType: "CTV_TO_BTC",
      rating,
      comment,
    });

    const btcProfile = await BTCProfile.findOne({ userId: event.btcId });
    if (btcProfile) {
      btcProfile.updateRating(rating);
      await btcProfile.save();
    }

    try {
      const notification = await Notification.create({
        userId: event.btcId,
        type: "REVIEW",
        title: "New Review Received",
        content: `You received a review for event "${event.title}"`,
        relatedId: review._id,
        relatedModel: "Review",
      });

      const io = req.app.get("io");
      if (io) {
        io.to(`user_${event.btcId.toString()}`).emit(
          "new_notification",
          notification,
        );
      }

      const btcUser = await require("../models/User").findById(event.btcId);
      if (btcUser) {
        await emailService.sendEmail({
          to: btcUser.email,
          subject: "New Review Received",
          text: `You have received a new review from a CTV for event: ${event.title}. Log in to view details.`,
          html: `
             <div>
               <h2>New Review Received</h2>
               <p>A CTV has reviewed your event: <strong>${event.title}</strong></p>
               <p>Rating: ${rating}/5</p>
               <p>Comment: ${comment || "No comment"}</p>
               <a href="${process.env.CLIENT_URL || "http://localhost:3000"}/dashboard/reviews">View Reviews</a>
             </div>
           `,
        });
      }
    } catch (notifyError) {
      console.error("Notification Error:", notifyError);
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

    const application = await Application.findOne({
      eventId,
      ctvId,
      status: { $in: ["COMPLETED", "NO_SHOW"] },
    });

    if (!application) {
      return res.status(400).json({
        success: false,
        message: "CTV did not complete this event",
      });
    }

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

    const review = await Review.create({
      eventId,
      fromUser: btcId,
      toUser: ctvId,
      reviewType: "BTC_TO_CTV",
      skill,
      attitude,
      comment,
    });

    const ctvProfile = await CTVProfile.findOne({ userId: ctvId });
    if (ctvProfile) {
      const avgRating = (skill + attitude) / 2;
      ctvProfile.updateReputation(avgRating);

      if (avgRating < 3) {
        ctvProfile.updateTrustScore(-2);
      }

      await ctvProfile.save();
    }

    try {
      const notification = await Notification.create({
        userId: ctvId,
        type: "REVIEW",
        title: "New Review Received",
        content: `You received a review from BTC for event "${event.title}"`,
        relatedId: review._id,
        relatedModel: "Review",
      });

      const io = req.app.get("io");
      if (io) {
        io.to(`user_${ctvId.toString()}`).emit(
          "new_notification",
          notification,
        );
      }

      // Fetch CTV email
      const ctvUser = await require("../models/User").findById(ctvId);
      if (ctvUser) {
        await emailService.sendEmail({
          to: ctvUser.email,
          subject: "New Review Received",
          text: `You have received a new review from the organizer of event: ${event.title}. Log in to view details.`,
          html: `
             <div>
               <h2>New Review from Organizer</h2>
               <p>The organizer of <strong>${event.title}</strong> has reviewed your performance.</p>
               <p>Skill: ${skill}/5, Attitude: ${attitude}/5</p>
               <p>Comment: ${comment || "No comment"}</p>
               <a href="${process.env.CLIENT_URL || "http://localhost:3000"}/dashboard/my-jobs">View Details</a>
             </div>
           `,
        });
      }
    } catch (notifyError) {
      console.error("Notification Error:", notifyError);
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

// @desc    Check if review exists
// @route   GET /api/reviews/check
// @access  Private
exports.checkReviewStatus = async (req, res, next) => {
  try {
    const { eventId, toUserId, reviewType } = req.query;
    const fromUserId = req.user._id;

    if (!eventId || !toUserId || !reviewType) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
    }

    const review = await Review.findOne({
      eventId,
      fromUser: fromUserId,
      toUser: toUserId,
      reviewType,
    });

    res.status(200).json({
      success: true,
      hasReviewed: !!review,
      review: review || null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment, skill, attitude } = req.body;
    const userId = req.user._id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (review.fromUser.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this review",
      });
    }

    if (review.reviewType === "CTV_TO_BTC") {
      const btcProfile = await BTCProfile.findOne({ userId: review.toUser });
      if (btcProfile && typeof rating === "number") {
        const oldRating = review.rating;
        const currentTotalScore =
          btcProfile.rating.average * btcProfile.rating.totalReviews;
        const newTotalScore = currentTotalScore - oldRating + rating;
        const newAverage = newTotalScore / btcProfile.rating.totalReviews;

        btcProfile.rating.average = Math.max(0, Math.min(5, newAverage));
        await btcProfile.save();

        review.rating = rating;
      }
    }

    if (review.reviewType === "BTC_TO_CTV") {
      const ctvProfile = await CTVProfile.findOne({ userId: review.toUser });
      if (
        ctvProfile &&
        typeof skill === "number" &&
        typeof attitude === "number"
      ) {
        const oldAvg = (review.skill + review.attitude) / 2;
        const newAvg = (skill + attitude) / 2;

        const currentTotalScore =
          ctvProfile.reputation.average * ctvProfile.reputation.totalReviews;
        const newTotalScore = currentTotalScore - oldAvg + newAvg;
        const newAverage = newTotalScore / ctvProfile.reputation.totalReviews;

        ctvProfile.reputation.average = Math.max(0, Math.min(5, newAverage));

        if (newAvg < 3 && oldAvg >= 3) {
          ctvProfile.updateTrustScore(-2);
        } else if (newAvg >= 3 && oldAvg < 3) {
          ctvProfile.updateTrustScore(2);
        }

        await ctvProfile.save();

        review.skill = skill;
        review.attitude = attitude;
      }
    }

    if (comment !== undefined) review.comment = comment;
    await review.save();

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (review.fromUser.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this review",
      });
    }

    if (review.reviewType === "CTV_TO_BTC") {
      const btcProfile = await BTCProfile.findOne({ userId: review.toUser });
      if (btcProfile) {
        // Revert average
        // newAvg = (currentTotal - oldRating) / (total - 1)
        const currentTotalScore =
          btcProfile.rating.average * btcProfile.rating.totalReviews;
        const newTotalScore = currentTotalScore - review.rating;
        const newTotalReviews = btcProfile.rating.totalReviews - 1;

        if (newTotalReviews > 0) {
          btcProfile.rating.average = newTotalScore / newTotalReviews;
        } else {
          btcProfile.rating.average = 0;
        }
        btcProfile.rating.totalReviews = Math.max(0, newTotalReviews);
        await btcProfile.save();
      }
    }

    if (review.reviewType === "BTC_TO_CTV") {
      const ctvProfile = await CTVProfile.findOne({ userId: review.toUser });
      if (ctvProfile) {
        const avgRating = (review.skill + review.attitude) / 2;

        const currentTotalScore =
          ctvProfile.reputation.average * ctvProfile.reputation.totalReviews;
        const newTotalScore = currentTotalScore - avgRating;
        const newTotalReviews = ctvProfile.reputation.totalReviews - 1;

        if (newTotalReviews > 0) {
          ctvProfile.reputation.average = newTotalScore / newTotalReviews;
        } else {
          ctvProfile.reputation.average = 0;
        }
        ctvProfile.reputation.totalReviews = Math.max(0, newTotalReviews);

        if (avgRating < 3) {
          ctvProfile.updateTrustScore(2); 
        }

        await ctvProfile.save();
      }
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
