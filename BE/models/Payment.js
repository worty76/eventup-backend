const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be positive"],
    },
    method: {
      type: String,
      enum: ["MOMO", "VNPAY", "PAYOS"],
      required: [true, "Payment method is required"],
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    description: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    subscriptionData: {
      plan: {
        type: String,
        enum: ["PREMIUM"],
      },
      duration: {
        type: Number, 
      },
    },
  },
  {
    timestamps: true,
  },
);

paymentSchema.index({ userId: 1, status: 1 });

paymentSchema.index({ status: 1, createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
