const mongoose = require("mongoose");

const btcProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    agencyName: {
      type: String,
      required: [true, "Agency name is required"],
      trim: true,
    },
    logo: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    fanpage: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    successfulEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      totalReviews: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  },
);

// Index for better query performance

btcProfileSchema.index({ verified: 1 });
btcProfileSchema.index({ "rating.average": -1 });

// Method to update rating
btcProfileSchema.methods.updateRating = function (newRating) {
  const currentAverage = this.rating.average;
  const totalReviews = this.rating.totalReviews;

  // Calculate new average
  const newAverage =
    (currentAverage * totalReviews + newRating) / (totalReviews + 1);

  this.rating.average = Math.max(0, Math.min(5, newAverage));
  this.rating.totalReviews += 1;
};

const BTCProfile = mongoose.model("BTCProfile", btcProfileSchema);

module.exports = BTCProfile;
