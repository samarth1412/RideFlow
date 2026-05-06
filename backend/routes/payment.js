const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const paymentController = require("../controllers/paymentController");

// @route   POST /api/payment/demo
// @desc    Process demo payment for a booking
// @access  Private
router.post("/demo", authMiddleware, paymentController.processDemoPayment);

// @route   GET /api/payment/booking/:bookingId
// @desc    Get payment details for a specific booking
// @access  Private
router.get("/booking/:bookingId", authMiddleware, paymentController.getPaymentByBooking);

// @route   GET /api/payment/user/history
// @desc    Get payment history for logged-in user
// @access  Private
router.get("/user/history", authMiddleware, paymentController.getUserPaymentHistory);

// @route   POST /api/payment/refund/:paymentId
// @desc    Refund a demo payment (for cancelled bookings)
// @access  Private
router.post("/refund/:paymentId", authMiddleware, paymentController.refundPayment);

// @route   DELETE /api/payment/user/clear-history
// @desc    Clear all payment history for logged-in user
// @access  Private
router.delete("/user/clear-history", authMiddleware, paymentController.clearUserPaymentHistory);

module.exports = router;
