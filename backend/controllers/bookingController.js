const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const userId = req.userId;
    const { vehicleId, pickupDate, dropoffDate, totalDays, pricePerDay, totalPrice, message } = req.body;

    // Validate required fields
    if (!vehicleId || !pickupDate || !dropoffDate || !totalDays || !pricePerDay || !totalPrice) {
      return res.status(400).json({ message: "All booking details are required" });
    }

    // Get vehicle to find owner
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // Check if vehicle is active
    if (vehicle.status !== "active") {
      return res.status(400).json({ message: "Vehicle is not available for booking" });
    }

    // Prevent booking own vehicle
    if (vehicle.owner.toString() === userId) {
      return res.status(400).json({ message: "You cannot book your own vehicle" });
    }

    // Check for existing pending/confirmed booking for same dates
    const existingBooking = await Booking.findOne({
      vehicle: vehicleId,
      status: { $in: ['PENDING', 'CONFIRMED'] },
      $or: [
        {
          pickupDate: { $lte: new Date(dropoffDate) },
          dropoffDate: { $gte: new Date(pickupDate) }
        }
      ]
    });

    if (existingBooking) {
      return res.status(400).json({ message: "Vehicle is already booked for these dates" });
    }

    // Calculate expiration time (5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Create booking
    const booking = await Booking.create({
      user: userId,
      vehicle: vehicleId,
      owner: vehicle.owner,
      pickupDate: new Date(pickupDate),
      dropoffDate: new Date(dropoffDate),
      totalDays,
      pricePerDay,
      totalPrice,
      message: message || "",
      expiresAt
    });

    // Populate booking details
    const populatedBooking = await Booking.findById(booking._id)
      .populate("vehicle", "name make model year image location")
      .populate("user", "name email picture")
      .populate("owner", "name email picture phone address city");

    res.status(201).json({
      success: true,
      message: "Booking request sent successfully",
      booking: populatedBooking
    });

  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get logged-in user's bookings (as renter)
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.userId;

    // First, expire any pending bookings that have passed their expiration time
    await Booking.updateMany(
      {
        status: 'PENDING',
        expiresAt: { $lt: new Date() }
      },
      { status: 'EXPIRED' }
    );

    // Get user's bookings (exclude EXPIRED)
    const bookings = await Booking.find({
      user: userId,
      status: { $ne: 'EXPIRED' }
    })
      .populate("vehicle", "name make model year image location fuelType seats")
      .populate("owner", "name email picture phone address city")
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });

  } catch (error) {
    console.error("Get user bookings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get booking requests for vehicle owner
exports.getOwnerRequests = async (req, res) => {
  try {
    const ownerId = req.userId;

    // First, expire any pending bookings that have passed their expiration time
    await Booking.updateMany(
      {
        status: 'PENDING',
        expiresAt: { $lt: new Date() }
      },
      { status: 'EXPIRED' }
    );

    // Get owner's booking requests (exclude EXPIRED)
    const bookings = await Booking.find({
      owner: ownerId,
      status: { $ne: 'EXPIRED' }
    })
      .populate("vehicle", "name make model year image location")
      .populate("user", "name email picture phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });

  } catch (error) {
    console.error("Get owner requests error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update booking status (owner confirms/rejects)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, rejectionReason } = req.body;
    const ownerId = req.userId;

    // Validate status
    if (!['CONFIRMED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Use CONFIRMED or REJECTED" });
    }

    // Find booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify ownership
    if (booking.owner.toString() !== ownerId) {
      return res.status(403).json({ message: "Not authorized to update this booking" });
    }

    // Check if booking is still pending
    if (booking.status !== 'PENDING') {
      return res.status(400).json({ message: `Cannot update booking with status: ${booking.status}` });
    }

    // Check if booking has expired
    if (new Date() > booking.expiresAt) {
      booking.status = 'EXPIRED';
      await booking.save();
      return res.status(400).json({ message: "Booking has expired" });
    }

    // Update status
    booking.status = status;
    if (status === 'REJECTED' && rejectionReason) {
      booking.rejectionReason = rejectionReason;
    }

    await booking.save();

    const updatedBooking = await Booking.findById(bookingId)
      .populate("vehicle", "name make model year image location")
      .populate("user", "name email picture")
      .populate("owner", "name email picture phone address city");

    res.json({
      success: true,
      message: `Booking ${status.toLowerCase()} successfully`,
      booking: updatedBooking
    });

  } catch (error) {
    console.error("Update booking status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Cancel booking (user cancels their own booking)
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify user owns this booking
    if (booking.user.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    }

    // Can only cancel PENDING or CONFIRMED bookings
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      return res.status(400).json({ message: `Cannot cancel booking with status: ${booking.status}` });
    }

    booking.status = 'CANCELLED';
    await booking.save();

    res.json({
      success: true,
      message: "Booking cancelled successfully"
    });

  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single booking details
exports.getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;

    const booking = await Booking.findById(bookingId)
      .populate("vehicle", "name make model year image location fuelType seats")
      .populate("user", "name email picture phone")
      .populate("owner", "name email picture phone");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Only allow user or owner to view
    if (booking.user._id.toString() !== userId && booking.owner._id.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to view this booking" });
    }

    res.json({ success: true, booking });

  } catch (error) {
    console.error("Get booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
