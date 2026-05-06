const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const User = require("../models/User");
const crypto = require("crypto");

// Generate a demo transaction ID
const generateTransactionId = () => {
  const prefix = "DEMO";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// Always succeed in demo mode to avoid confusing users
const simulatePaymentOutcome = () => {
  return true;
};

// @route   POST /api/payment/demo
// @desc    Process demo payment for a booking
// @access  Private
exports.processDemoPayment = async (req, res) => {
  try {
    const userId = req.userId;
    const { bookingId, paymentMethod, amount } = req.body;

    console.log("Processing demo payment:", { bookingId, paymentMethod, amount });

    // Validate input
    if (!bookingId || !paymentMethod) {
      return res.status(400).json({ 
        message: "Booking ID and payment method are required" 
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId)
      .populate("vehicle")
      .populate("user")
      .populate("owner");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const ownerId = booking.owner?._id || booking.owner;
    const vehicleId = booking.vehicle?._id || booking.vehicle;

    if (!ownerId) {
      return res.status(400).json({ message: "Owner information missing for this booking" });
    }

    if (!vehicleId) {
      return res.status(400).json({ message: "Vehicle information missing for this booking" });
    }

    // Verify that the user making payment is the booking user
    if (booking.user._id.toString() !== userId) {
      return res.status(403).json({ 
        message: "You are not authorized to pay for this booking" 
      });
    }

    // Check if booking is confirmed
    if (booking.status !== "CONFIRMED") {
      return res.status(400).json({ 
        message: "Booking must be confirmed before payment can be made" 
      });
    }

    // Check if already paid
    if (booking.paymentStatus === "COMPLETED") {
      return res.status(400).json({ 
        message: "This booking has already been paid for" 
      });
    }

    // Calculate fare breakdown
    const totalPrice = booking.totalPrice;
    const baseFare = Math.floor(totalPrice * 0.7); // 70% base fare
    const distanceFare = Math.floor(totalPrice * 0.2); // 20% distance
    const serviceFee = totalPrice - baseFare - distanceFare; // Remaining as service fee

    // Simulate payment processing delay (2-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

    // Simulate payment outcome (90% success, 10% failure)
    const isSuccess = simulatePaymentOutcome();

    if (!isSuccess) {
      // Payment failed
      const failedPayment = new Payment({
        booking: bookingId,
        user: userId,
        owner: ownerId,
        vehicle: vehicleId,
        amount: {
          baseFare,
          distanceFare,
          serviceFee,
          totalAmount: totalPrice
        },
        paymentMethod,
        status: "FAILED",
        transactionId: generateTransactionId(),
        failureReason: "Demo: Random payment failure (10% probability)",
        isDemoTransaction: true,
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          deviceType: "web"
        }
      });

      await failedPayment.save();

      console.log("Demo payment failed:", failedPayment.transactionId);

      return res.status(400).json({
        success: false,
        message: "Payment failed. Please try again.",
        transactionId: failedPayment.transactionId,
        failureReason: "Demo: Random failure simulation"
      });
    }

    // Payment successful
    const transactionId = generateTransactionId();

    // Handle wallet payment (deduct from user, add to owner)
    if (paymentMethod === 'Demo Wallet') {
      const user = await User.findById(userId);
      const owner = await User.findById(ownerId);

      if (!owner) {
        return res.status(400).json({
          success: false,
          message: "Owner account no longer exists. Payment cannot be processed."
        });
      }

      // Check if user has sufficient balance
      if (user.walletBalance < totalPrice) {
        return res.status(400).json({
          success: false,
          message: "Insufficient wallet balance",
          currentBalance: user.walletBalance,
          required: totalPrice
        });
      }

      // Deduct from user's wallet
      user.walletBalance -= totalPrice;
      await user.save();

      // Add to owner's wallet
      owner.walletBalance += totalPrice;
      await owner.save();

      console.log(`Wallet transaction: User ${user.name} paid USD ${totalPrice} to ${owner.name}`);
    }

    // Create payment record with booking details snapshot
    const payment = new Payment({
      booking: bookingId,
      user: userId,
      owner: ownerId,
      vehicle: vehicleId,
      bookingDetails: {
        pickupDate: booking.pickupDate,
        dropoffDate: booking.dropoffDate,
        totalDays: booking.totalDays,
        pickupLocation: booking.pickupLocation || 'N/A',
        vehicleName: booking.vehicle?.name || 'Unknown Vehicle',
        vehicleModel: booking.vehicle?.model || 'N/A'
      },
      amount: {
        baseFare,
        distanceFare,
        serviceFee,
        totalAmount: totalPrice
      },
      paymentMethod,
      status: "COMPLETED",
      transactionId,
      completedAt: new Date(),
      isDemoTransaction: true,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        deviceType: "web"
      }
    });

    await payment.save();
    
    console.log("💾 Payment record created with booking snapshot:", {
      transactionId,
      amount: totalPrice,
      bookingDetails: payment.bookingDetails
    });

    // Update booking payment status
    booking.paymentStatus = "COMPLETED";
    booking.paymentMethod = paymentMethod;
    booking.paidAt = new Date();
    booking.transactionId = transactionId;
    await booking.save();

    // Mark vehicle as inactive since it's now booked and paid
    const Vehicle = require("../models/Vehicle");
    await Vehicle.findByIdAndUpdate(vehicleId, { status: 'inactive' });

    console.log("✅ Demo payment successful:", transactionId);
    console.log("🚗 Vehicle marked as inactive:", vehicleId);

    // Get updated user balance
    const updatedUser = await User.findById(userId);

    res.json({
      success: true,
      message: "Payment successful",
      transactionId,
      paymentId: payment._id,
      amount: totalPrice,
      paymentMethod,
      completedAt: payment.completedAt,
      newBalance: updatedUser.walletBalance,
      booking: {
        id: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        vehicle: booking.vehicle ? {
          name: booking.vehicle.name,
          model: booking.vehicle.model
        } : null
      }
    });

  } catch (error) {
    console.error("Demo payment error:", error);
    res.status(500).json({ 
      message: "Payment processing failed", 
      error: error.message 
    });
  }
};

// @route   GET /api/payment/booking/:bookingId
// @desc    Get payment details for a booking
// @access  Private
exports.getPaymentByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;

    const payment = await Payment.findOne({ booking: bookingId })
      .populate("booking")
      .populate("vehicle", "name model")
      .populate("user", "name email")
      .populate("owner", "name email");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Verify user has access to this payment
    if (
      payment.user._id.toString() !== userId &&
      payment.owner._id.toString() !== userId
    ) {
      return res.status(403).json({ 
        message: "You are not authorized to view this payment" 
      });
    }

    res.json({ payment });

  } catch (error) {
    console.error("Get payment error:", error);
    res.status(500).json({ 
      message: "Failed to retrieve payment", 
      error: error.message 
    });
  }
};

// @route   GET /api/payment/user/history
// @desc    Get payment history for logged-in user (real transactions only)
// @access  Private
exports.getUserPaymentHistory = async (req, res) => {
  try {
    const userId = req.userId;

    // Get payments where user is either payer or receiver - COMPLETED transactions only
    const payments = await Payment.find({
      $or: [
        { user: userId },
        { owner: userId }
      ],
      status: 'COMPLETED' // Only show completed real transactions
    })
      .populate("booking", "pickupDate dropoffDate totalDays pickupLocation")
      .populate("vehicle", "name model image")
      .populate("user", "name picture email phone")
      .populate("owner", "name picture email phone")
      .sort({ completedAt: -1, createdAt: -1 })
      .limit(100);

    // Transform data to show whether it's debit or credit with complete information
    const transactions = payments.map(payment => {
      const isDebit = payment.user._id.toString() === userId;
      const otherParty = isDebit ? payment.owner : payment.user;
      const vehicleName = payment.vehicle?.name || payment.bookingDetails?.vehicleName || 'Unknown Vehicle';
      const vehicleModel = payment.vehicle?.model || payment.bookingDetails?.vehicleModel || '';
      
      return {
        _id: payment._id,
        transactionId: payment.transactionId,
        amount: payment.amount.totalAmount,
        type: isDebit ? 'DEBIT' : 'CREDIT',
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        date: payment.completedAt || payment.createdAt,
        // Use booking details snapshot if booking was deleted
        booking: payment.booking || {
          pickupDate: payment.bookingDetails?.pickupDate,
          dropoffDate: payment.bookingDetails?.dropoffDate,
          totalDays: payment.bookingDetails?.totalDays,
          pickupLocation: payment.bookingDetails?.pickupLocation
        },
        vehicle: payment.vehicle || {
          name: payment.bookingDetails?.vehicleName,
          model: payment.bookingDetails?.vehicleModel,
          image: null
        },
        otherParty: {
          _id: otherParty._id,
          name: otherParty.name,
          picture: otherParty.picture,
          email: otherParty.email,
          phone: otherParty.phone
        },
        description: isDebit 
          ? `Payment to ${otherParty.name} for ${vehicleName} ${vehicleModel}`.trim()
          : `Payment from ${otherParty.name} for ${vehicleName} ${vehicleModel}`.trim(),
        // Additional details for transparency
        amountBreakdown: {
          baseFare: payment.amount.baseFare,
          distanceFare: payment.amount.distanceFare,
          serviceFee: payment.amount.serviceFee,
          total: payment.amount.totalAmount
        }
      };
    });

    console.log(`📜 Retrieved ${transactions.length} real transactions for user ${userId}`);

    res.json({ 
      payments: transactions,
      total: transactions.length 
    });

  } catch (error) {
    console.error("Get payment history error:", error);
    res.status(500).json({ 
      message: "Failed to retrieve payment history", 
      error: error.message 
    });
  }
};

// @route   POST /api/payment/refund/:paymentId
// @desc    Refund a demo payment (for cancelled bookings)
// @access  Private
exports.refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.userId;

    const payment = await Payment.findById(paymentId).populate("booking");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Verify user owns this payment
    if (payment.user.toString() !== userId) {
      return res.status(403).json({ 
        message: "You are not authorized to refund this payment" 
      });
    }

    // Check if already refunded
    if (payment.status === "REFUNDED") {
      return res.status(400).json({ 
        message: "This payment has already been refunded" 
      });
    }

    // Check if payment is completed
    if (payment.status !== "COMPLETED") {
      return res.status(400).json({ 
        message: "Only completed payments can be refunded" 
      });
    }

    // Update payment status
    payment.status = "REFUNDED";
    await payment.save();

    // Update booking payment status
    const booking = await Booking.findById(payment.booking);
    if (booking) {
      booking.paymentStatus = "REFUNDED";
      await booking.save();
    }

    console.log("💰 Demo payment refunded:", payment.transactionId);

    res.json({
      success: true,
      message: "Payment refunded successfully",
      transactionId: payment.transactionId,
      refundAmount: payment.amount.totalAmount
    });

  } catch (error) {
    console.error("Refund payment error:", error);
    res.status(500).json({ 
      message: "Refund processing failed", 
      error: error.message 
    });
  }
};

// @route   DELETE /api/payment/user/clear-history
// @desc    Clear payment history visible to logged-in user (deletes where user is payer OR receiver)
// @access  Private
exports.clearUserPaymentHistory = async (req, res) => {
  try {
    const userId = req.userId;

    // Delete all payments where the user is either the payer OR the receiver
    const result = await Payment.deleteMany({
      $or: [
        { user: userId },
        { owner: userId }
      ]
    });

    console.log(`Cleared ${result.deletedCount} transactions for user ${userId}`);

    res.json({
      success: true,
      message: "Transaction history cleared successfully",
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error("Clear history error:", error);
    res.status(500).json({ 
      message: "Failed to clear transaction history", 
      error: error.message 
    });
  }
};
