const mongoose = require("mongoose");

const ctvProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
      default: "OTHER",
    },
    address: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    experiences: [
      {
        type: String,
        trim: true,
      },
    ],
    joinedEvents: [
      {
        eventId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Event",
        },
        role: {
          type: String,
          trim: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    reputation: {
      score: {
        type: Number,
        default: 10,
        min: 0,
        max: 10,
      },
      totalReviews: {
        type: Number,
        default: 0,
      },
    },
    trustScore: {
      type: Number,
      default: 10,
      min: 0,
      max: 10,
    },
  },
  {
    timestamps: true,
  },
);

// Index for better query performance

ctvProfileSchema.index({ "reputation.score": -1 });
ctvProfileSchema.index({ trustScore: -1 });

// Method to update rating (reputation score)
ctvProfileSchema.methods.updateReputation = function (ratingValue) {
  const currentScore = this.reputation.score;
  const totalReviews = this.reputation.totalReviews;

  // Calculate new average
  const newScore =
    (currentScore * totalReviews + ratingValue) / (totalReviews + 1);

  this.reputation.score = Math.max(0, Math.min(5, newScore)); // Fix max to 5 for rating
  this.reputation.totalReviews += 1;
};

// Method to update trust score
ctvProfileSchema.methods.updateTrustScore = function (delta) {
  let newScore = this.trustScore + delta;
  // Ensure within bounds 0-10
  if (newScore > 10) newScore = 10;
  if (newScore < 0) newScore = 0;
  this.trustScore = newScore;
};

const CTVProfile = mongoose.model("CTVProfile", ctvProfileSchema);

module.exports = CTVProfile;
