const mongoose = require("mongoose");

// Schema for job detail items in the job description table
const jobDetailItemSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      trim: true,
    },
    task: {
      type: String,
      required: true,
      trim: true,
    },
    workTime: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    salary: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const eventSchema = new mongoose.Schema(
  {
    btcId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "BTC ID is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    eventType: {
      type: String,
      enum: [
        "Concert",
        "Workshop",
        "Festival",
        "Conference",
        "Sports",
        "Exhibition",
        "Other",
      ],
      required: [true, "Event type is required"],
    },
    salary: {
      type: String,
      trim: true,
    },
    benefits: {
      type: String,
      trim: true,
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "End time is required"],
    },
    deadline: {
      type: Date,
      required: [true, "Application deadline is required"],
    },
    quantity: {
      type: Number,
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
    jobDetailsItems: [jobDetailItemSchema], // New: array of job detail items
    appliedCount: {
      type: Number,
      default: 0,
    },
    approvedCount: {
      type: Number,
      default: 0,
    },
    poster: {
      type: String,
      default: null,
    },
    urgent: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["PREPARING", "RECRUITING", "COMPLETED", "CANCELLED"],
      default: "PREPARING",
    },
    views: {
      type: Number,
      default: 0,
    },
    requirements: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  },
);

eventSchema.pre("save", function (next) {
  if (this.endTime <= this.startTime) {
    next(new Error("End time must be after start time"));
  }
  if (this.deadline >= this.startTime) {
    next(new Error("Deadline must be before start time"));
  }
  next();
});

eventSchema.index({ btcId: 1 });
eventSchema.index({ status: 1, deadline: -1 });
eventSchema.index({ location: 1 });
eventSchema.index({ eventType: 1 });
eventSchema.index({ urgent: 1, createdAt: -1 });
eventSchema.index({ title: "text", description: "text" });

eventSchema.methods.canApply = function () {
  // Calculate total quantity from jobDetailsItems if available, otherwise use quantity field
  let totalQuantity = this.quantity || 0;
  if (this.jobDetailsItems && this.jobDetailsItems.length > 0) {
    totalQuantity = this.jobDetailsItems.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0,
    );
  }

  // Check against approvedCount instead of appliedCount
  return (
    this.status === "RECRUITING" &&
    new Date() < this.deadline &&
    (this.approvedCount || 0) < totalQuantity
  );
};

eventSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
