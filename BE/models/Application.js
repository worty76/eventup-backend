const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event ID is required"],
    },
    ctvId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "CTV ID is required"],
    },
    coverLetter: {
      type: String,
      trim: true,
      maxlength: [1000, "Cover letter cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "APPROVED",
        "REJECTED",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ],
      default: "PENDING",
    },
    assignedRole: {
      type: String,
      trim: true,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to ensure one application per user per event
applicationSchema.index({ eventId: 1, ctvId: 1 }, { unique: true });

// Indexes for queries
applicationSchema.index({ eventId: 1, status: 1 });
applicationSchema.index({ ctvId: 1, status: 1 });
applicationSchema.index({ status: 1, createdAt: -1 });

// Prevent duplicate application
applicationSchema.pre("save", async function (next) {
  if (this.isNew) {
    const existingApp = await mongoose.model("Application").findOne({
      eventId: this.eventId,
      ctvId: this.ctvId,
    });

    if (existingApp) {
      throw new Error("You have already applied to this event");
    }
  }
  next();
});

const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;
