const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const vehicleRoutes = require("./routes/vehicle");
const bookingRoutes = require("./routes/booking");
const recommendationRoutes = require("./routes/recommendation");
const paymentRoutes = require("./routes/payment");


dotenv.config();

const app = express();

// Behind AWS ELB / CloudFront — correct client IP and secure cookies if you add them later
app.set('trust proxy', 1);

connectDB();

function corsAllowedOrigin() {
  const raw = (process.env.FRONTEND_URL || '').trim();
  if (!raw) {
    return 'http://localhost:3000';
  }
  const origins = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return origins.length === 1 ? origins[0] : origins;
}

// Middleware — comma-separated FRONTEND_URL for local + CloudFront during cutover
app.use(
  cors({
    origin: corsAllowedOrigin(),
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/payment', paymentRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
