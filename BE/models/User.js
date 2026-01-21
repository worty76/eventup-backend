const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    passwordHash: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ["CTV", "BTC", "ADMIN"],
      required: [true, "Role is required"],
    },
    phone: {
      type: String,
      trim: true,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "BLOCKED", "PENDING"],
      default: "PENDING",
    },
    subscription: {
      plan: {
        type: String,
        enum: ["FREE", "PREMIUM"],
        default: "FREE",
      },
      expiredAt: {
        type: Date,
        default: null,
      },
      urgentUsed: {
        type: Number,
        default: 0,
      },
      postUsed: {
        type: Number,
        default: 0,
      },
    },
    googleId: {
      type: String,
      sparse: true,
    },
    otp: {
      code: String,
      expiresAt: Date,
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for BTC Profile
userSchema.virtual("btcProfile", {
  ref: "BTCProfile",
  localField: "_id",
  foreignField: "userId",
  justOne: true,
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash") || !this.passwordHash) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  const user = await mongoose
    .model("User")
    .findById(this._id)
    .select("+passwordHash");
  if (!user.passwordHash) return false;
  return await bcrypt.compare(candidatePassword, user.passwordHash);
};

// Check if subscription is active
userSchema.methods.isPremiumActive = function () {
  if (this.subscription.plan !== "PREMIUM") return false;
  if (!this.subscription.expiredAt) return false;
  return new Date() < this.subscription.expiredAt;
};

// Reset monthly limits (called by cron)
userSchema.methods.resetMonthlyLimits = function () {
  this.subscription.urgentUsed = 0;
  this.subscription.postUsed = 0;
};

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1, status: 1 });

const User = mongoose.model("User", userSchema);

module.exports = User;
