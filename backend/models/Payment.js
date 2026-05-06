const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  // Reference to booking
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true
  },
  // User who made the payment (payer)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  // Vehicle owner who receives the payment (receiver)
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  // Vehicle being paid for
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
    required: true
  },
  // Store booking details snapshot (in case booking is deleted)
  bookingDetails: {
    pickupDate: Date,
    dropoffDate: Date,
    totalDays: Number,
    pickupLocation: String,
    vehicleName: String,
    vehicleModel: String
  },
  // Amount breakdown
  amount: {
    baseFare: {
      type: Number,
      required: true
    },
    distanceFare: {
      type: Number,
      default: 0
    },
    serviceFee: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    }
  },
  // Payment method
  paymentMethod: {
    type: String,
    enum: ['Demo Wallet', 'Cash'],
    required: true
  },
  // Payment status
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  // Unique transaction ID
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  // When payment was initiated
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  // When payment was completed
  completedAt: {
    type: Date,
    default: null
  },
  // Failure reason if any
  failureReason: {
    type: String,
    default: null
  },
  // Flag to identify demo transactions
  isDemoTransaction: {
    type: Boolean,
    default: true
  },
  // Additional metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceType: String
  }
}, {
  timestamps: true
});

// Index for quick lookups
paymentSchema.index({ booking: 1 });
paymentSchema.index({ user: 1 });
// transactionId already indexed via unique: true
paymentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
