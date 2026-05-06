const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  createBooking,
  getUserBookings,
  getOwnerRequests,
  updateBookingStatus,
  cancelBooking,
  getBookingById
} = require("../controllers/bookingController");

// All routes are protected
router.use(authMiddleware);

// Create a new booking — verification is optional (trust badge only)
router.post("/", createBooking);

// Get logged-in user's bookings (as renter)
router.get("/user", getUserBookings);

// Get booking requests for vehicle owner
router.get("/owner", getOwnerRequests);

// Get single booking by ID
router.get("/:bookingId", getBookingById);

// Update booking status (owner confirms/rejects)
router.patch("/:bookingId/status", updateBookingStatus);

// Cancel booking (user cancels)
router.patch("/:bookingId/cancel", cancelBooking);

module.exports = router;
