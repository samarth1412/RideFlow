# Become a Host - Complete System Documentation

## Overview
The "Become a Host" feature enables verified users to list their vehicles on RideShareX, manage their fleet, and handle rental requests from renters. This document covers the complete workflow from the frontend UI to backend APIs and database operations.

---

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Frontend Components](#frontend-components)
3. [API Endpoints](#api-endpoints)
4. [Backend Controllers & Models](#backend-controllers--models)
5. [Authentication & Authorization](#authentication--authorization)
6. [User Flow](#user-flow)
7. [Database Schema](#database-schema)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Become Host Page                         │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │ Add Vehicle│  │ Manage       │  │ Rental          │    │
│  │            │  │ Vehicles     │  │ Requests        │    │
│  └─────┬──────┘  └──────┬───────┘  └────────┬────────┘    │
└────────┼─────────────────┼──────────────────┼──────────────┘
         │                 │                  │
         │                 │                  │
    ┌────▼─────────────────▼──────────────────▼─────┐
    │          API Layer (axios)                     │
    │  - Handles authentication headers              │
    │  - Makes HTTP requests to backend              │
    └────────────────────┬───────────────────────────┘
                         │
    ┌────────────────────▼───────────────────────────┐
    │         Backend Routes & Middleware            │
    │  ┌──────────────┐  ┌────────────────────┐     │
    │  │ authMiddleware│  │  verifyUser        │     │
    │  │ (JWT Check)  │  │  (Verification)    │     │
    │  └──────┬───────┘  └────────┬───────────┘     │
    └─────────┼────────────────────┼─────────────────┘
              │                    │
    ┌─────────▼────────────────────▼─────────────────┐
    │        Controllers (Business Logic)            │
    │  - vehicleController                           │
    │  - bookingController                           │
    └────────────────────┬───────────────────────────┘
                         │
    ┌────────────────────▼───────────────────────────┐
    │         MongoDB Database                       │
    │  - Vehicle Collection                          │
    │  - User Collection                             │
    │  - Booking Collection                          │
    └────────────────────────────────────────────────┘
```

---

## Frontend Components

### 1. BecomeHostPage.jsx
**Location:** `frontend/src/pages/vehicles/BecomeHostPage.jsx`

**Purpose:** Landing page that provides three main hosting options

**Features:**
- Navigation hub for host operations
- Three card-based options:
  - **Add Vehicle** - List new vehicles
  - **Manage Vehicles** - Edit/delete existing vehicles
  - **Rental Requests** - View and respond to bookings

**State Management:**
```javascript
// No complex state - purely navigational component
const navigate = useNavigate();

// Options with routing
const options = [
  {
    title: "Add Vehicle",
    onClick: () => navigate("/add-vehicle")
  },
  {
    title: "Manage My Vehicles",
    onClick: () => navigate("/manage-vehicles")
  },
  {
    title: "Rental Requests",
    onClick: () => navigate("/rental-requests")
  }
];
```

**UI Elements:**
- Gradient background (blue-to-indigo theme)
- Card-based navigation with icons
- Back button to return to previous page
- Responsive grid layout (3 columns on desktop, 1 on mobile)

---

### 2. AddVehiclePage.jsx
**Location:** `frontend/src/pages/vehicles/AddVehiclePage.jsx`

**Purpose:** Form to add new vehicles to the platform

**State Management:**
```javascript
const [vehicleData, setVehicleData] = useState({
  name: "",
  make: "",
  model: "",
  year: "",
  seats: "",
  location: "",
  type: "",
  fuelType: "",
  plateNumber: "",
  pricePerDay: ""
});

const [imageFile, setImageFile] = useState(null);
const [imagePreview, setImagePreview] = useState(null);
const [uploading, setUploading] = useState(false);
```

**Image Upload Flow:**
1. User selects image file
2. Preview generated using `URL.createObjectURL()`
3. On submit, image uploaded to **Cloudinary** CDN
4. Cloudinary returns secure URL
5. URL stored in vehicle database record

**Cloudinary Configuration:**
```javascript
const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );
  
  return data.secure_url;
};
```

**Form Submission:**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // 1. Validate all required fields
  if (!vehicleData.name || !vehicleData.make || ...) {
    return alert("Please fill all required fields");
  }
  
  // 2. Upload image to Cloudinary
  let imageUrl = '/photos/default-car.jpg';
  if (imageFile) {
    imageUrl = await uploadToCloudinary(imageFile);
  }
  
  // 3. Send data to backend API
  const res = await axios.post(
    "http://localhost:5000/api/vehicles/add",
    {
      ...vehicleData,
      year: parseInt(vehicleData.year),
      seats: parseInt(vehicleData.seats),
      pricePerDay: parseInt(vehicleData.pricePerDay),
      image: imageUrl
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  
  // 4. Redirect to vehicles page
  navigate('/vehicles');
};
```

**Verification Warning:**
- Shows alert if user account is not verified
- Prevents form submission for unverified users
- Links to admin verification page

---

### 3. ManageVehiclesPage.jsx
**Location:** `frontend/src/pages/vehicles/ManageVehiclesPage.jsx`

**Purpose:** Dashboard to manage all user-owned vehicles

**State Management:**
```javascript
const [vehicles, setVehicles] = useState([]);
const [loading, setLoading] = useState(true);
const [actionLoading, setActionLoading] = useState(null);
const [activeBookings, setActiveBookings] = useState({});
```

**Key Features:**

#### Fetch User Vehicles
```javascript
const fetchUserVehicles = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(
    "http://localhost:5000/api/vehicles/my-vehicles",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  setVehicles(res.data.vehicles || []);
};
```

#### Toggle Vehicle Status (Active/Inactive)
```javascript
const toggleVehicleStatus = async (vehicleId, currentStatus) => {
  const newStatus = currentStatus === "active" ? "inactive" : "active";
  
  const token = localStorage.getItem("token");
  await axios.patch(
    `http://localhost:5000/api/vehicles/${vehicleId}/status`,
    { status: newStatus },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  // Update local state
  setVehicles(vehicles.map(v => 
    v._id === vehicleId ? { ...v, status: newStatus } : v
  ));
};
```

#### Delete Vehicle
```javascript
const deleteVehicle = async (vehicleId) => {
  // Prevent deletion if vehicle has active booking
  if (activeBookings[vehicleId]) {
    alert("Cannot delete a vehicle that is currently rented.");
    return;
  }
  
  const token = localStorage.getItem("token");
  await axios.delete(
    `http://localhost:5000/api/vehicles/${vehicleId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  setVehicles(vehicles.filter(v => v._id !== vehicleId));
};
```

#### Active Bookings Check
```javascript
const fetchActiveBookings = async () => {
  const res = await axios.get(
    "http://localhost:5000/api/bookings/rental-requests",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  // Map vehicle IDs to active bookings
  const bookingsMap = {};
  res.data.bookings.forEach(booking => {
    if (booking.status === 'CONFIRMED' && 
        booking.paymentStatus === 'COMPLETED') {
      bookingsMap[booking.vehicle._id] = {
        renterName: booking.user.name,
        pickupDate: booking.pickupDate,
        dropoffDate: booking.dropoffDate,
        totalPrice: booking.totalPrice
      };
    }
  });
  setActiveBookings(bookingsMap);
};
```

**UI Features:**
- Vehicle cards with image, details, and stats
- Status badge (Active/Inactive)
- Active booking indicator (if rented)
- Action buttons: Toggle Status, Delete
- Empty state message when no vehicles
- Quick add vehicle button

---

### 4. RentalRequestsPage.jsx
**Location:** `frontend/src/pages/bookings/RentalRequestsPage.jsx`

**Purpose:** View and manage booking requests for owned vehicles

**State Management:**
```javascript
const [requests, setRequests] = useState([]);
const [loading, setLoading] = useState(true);
const [actionLoading, setActionLoading] = useState(null);
const [rejectionModal, setRejectionModal] = useState({ 
  open: false, 
  bookingId: null 
});
const [rejectionReason, setRejectionReason] = useState('');
```

**Key Features:**

#### Fetch Rental Requests
```javascript
const fetchRequests = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(
    "http://localhost:5000/api/bookings/owner",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  setRequests(res.data.bookings || []);
};
```

#### Update Booking Status
```javascript
const updateBookingStatus = async (bookingId, status, reason = '') => {
  const token = localStorage.getItem("token");
  await axios.patch(
    `http://localhost:5000/api/bookings/${bookingId}/status`,
    { status, rejectionReason: reason },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  fetchRequests(); // Refresh list
};
```

**Booking Statuses:**
- **PENDING** - Awaiting owner response (yellow badge)
- **CONFIRMED** - Owner accepted (green badge)
- **REJECTED** - Owner declined (red badge)
- **CANCELLED** - User cancelled (gray badge)
- **COMPLETED** - Rental finished (blue badge)

**Special Status Display:**
```javascript
// When confirmed but payment not completed
if (status === 'CONFIRMED' && paymentStatus !== 'COMPLETED') {
  return (
    <div>
      <span>Booking Confirmed</span>
      <span>Awaiting Payment</span>
    </div>
  );
}
```

**UI Features:**
- Auto-refresh every 2 minutes
- Time remaining counter for pending requests
- Renter contact information
- Booking date range display
- Accept/Reject action buttons
- Rejection reason modal
- Payment status indicator

---

## API Endpoints

### Vehicle Management APIs

#### 1. Add Vehicle
```
POST /api/vehicles/add
Authentication: Required (JWT)
Verification: Required (isVerified = true)
```

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "name": "Honda Civic 2020",
  "make": "Honda",
  "model": "Civic",
  "year": 2020,
  "seats": 5,
  "location": "Kathmandu, Nepal",
  "type": "car",
  "fuelType": "Petrol",
  "plateNumber": "BA 12 PA 1234",
  "pricePerDay": 5000,
  "image": "https://res.cloudinary.com/..."
}
```

**Response (201 Created):**
```json
{
  "message": "Vehicle added successfully",
  "vehicle": {
    "_id": "60f7b3c7e4b0f83d4c8e9a12",
    "name": "Honda Civic 2020",
    "make": "Honda",
    "model": "Civic",
    "year": 2020,
    "seats": 5,
    "location": "Kathmandu, Nepal",
    "type": "car",
    "fuelType": "Petrol",
    "plateNumber": "BA 12 PA 1234",
    "pricePerDay": 5000,
    "image": "https://res.cloudinary.com/...",
    "owner": "60f7b3c7e4b0f83d4c8e9a00",
    "status": "active",
    "rating": 0,
    "totalRatings": 0,
    "completedBookings": 0,
    "createdAt": "2024-01-28T10:30:00.000Z",
    "updatedAt": "2024-01-28T10:30:00.000Z"
  }
}
```

**Error Responses:**
```json
// Missing fields (400)
{
  "message": "All fields are required including pricePerDay and type"
}

// Not verified (403)
{
  "message": "Account not verified. Please upload your citizenship document and wait for admin approval.",
  "verificationStatus": "pending",
  "rejectionReason": null
}

// Unauthorized (401)
{
  "message": "Invalid token"
}
```

---

#### 2. Get All Vehicles (Public)
```
GET /api/vehicles/
Authentication: Not Required
```

**Response (200 OK):**
```json
{
  "success": true,
  "vehicles": [
    {
      "_id": "60f7b3c7e4b0f83d4c8e9a12",
      "name": "Honda Civic 2020",
      "make": "Honda",
      "model": "Civic",
      "year": 2020,
      "seats": 5,
      "location": "Kathmandu, Nepal",
      "type": "car",
      "fuelType": "Petrol",
      "pricePerDay": 5000,
      "image": "https://res.cloudinary.com/...",
      "status": "active",
      "rating": 4.5,
      "totalRatings": 12,
      "completedBookings": 8,
      "owner": {
        "_id": "60f7b3c7e4b0f83d4c8e9a00",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

**Notes:**
- Only returns vehicles with `status: "active"`
- Excludes vehicles currently booked with completed payments
- Populates owner name and email

---

#### 3. Get User's Vehicles
```
GET /api/vehicles/my-vehicles
Authentication: Required (JWT)
```

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "success": true,
  "vehicles": [
    {
      "_id": "60f7b3c7e4b0f83d4c8e9a12",
      "name": "Honda Civic 2020",
      "status": "active",
      // ... all vehicle fields
    },
    {
      "_id": "60f7b3c7e4b0f83d4c8e9a13",
      "name": "Toyota Corolla 2019",
      "status": "inactive",
      // ... all vehicle fields
    }
  ]
}
```

**Notes:**
- Returns ALL vehicles owned by authenticated user
- Includes both active and inactive vehicles

---

#### 4. Update Vehicle Status
```
PATCH /api/vehicles/:vehicleId/status
Authentication: Required (JWT)
```

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "status": "inactive"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Status updated",
  "vehicle": {
    "_id": "60f7b3c7e4b0f83d4c8e9a12",
    "status": "inactive",
    // ... other fields
  }
}
```

**Error Responses:**
```json
// Invalid status (400)
{
  "message": "Invalid status"
}

// Not owner (403)
{
  "message": "Not authorized to update this vehicle"
}

// Vehicle not found (404)
{
  "message": "Vehicle not found"
}
```

---

#### 5. Delete Vehicle
```
DELETE /api/vehicles/:vehicleId
Authentication: Required (JWT)
```

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Vehicle deleted successfully"
}
```

**Error Responses:**
```json
// Not owner (403)
{
  "message": "Not authorized to delete this vehicle"
}

// Vehicle not found (404)
{
  "message": "Vehicle not found"
}

// Active bookings exist (400)
{
  "message": "Cannot delete vehicle with active bookings"
}
```

---

### Booking Management APIs

#### 6. Get Owner's Rental Requests
```
GET /api/bookings/owner
Authentication: Required (JWT)
```

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "bookings": [
    {
      "_id": "60f7b3c7e4b0f83d4c8e9b01",
      "user": {
        "_id": "60f7b3c7e4b0f83d4c8e9a01",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "phone": "+977-9812345678"
      },
      "vehicle": {
        "_id": "60f7b3c7e4b0f83d4c8e9a12",
        "name": "Honda Civic 2020",
        "plateNumber": "BA 12 PA 1234"
      },
      "pickupDate": "2024-02-01T00:00:00.000Z",
      "dropoffDate": "2024-02-05T00:00:00.000Z",
      "totalPrice": 20000,
      "status": "PENDING",
      "paymentStatus": "PENDING",
      "expiresAt": "2024-01-29T10:30:00.000Z",
      "createdAt": "2024-01-28T10:30:00.000Z"
    }
  ]
}
```

**Booking Statuses:**
- `PENDING` - Awaiting owner response
- `CONFIRMED` - Owner accepted
- `REJECTED` - Owner declined
- `CANCELLED` - User cancelled
- `COMPLETED` - Rental period finished

**Payment Statuses:**
- `PENDING` - Not paid
- `PROCESSING` - Payment in progress
- `COMPLETED` - Payment successful
- `FAILED` - Payment failed

---

#### 7. Update Booking Status
```
PATCH /api/bookings/:bookingId/status
Authentication: Required (JWT)
```

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "status": "CONFIRMED",
  "rejectionReason": "" // Optional, required if status is REJECTED
}
```

**Response (200 OK):**
```json
{
  "message": "Booking confirmed",
  "booking": {
    "_id": "60f7b3c7e4b0f83d4c8e9b01",
    "status": "CONFIRMED",
    // ... other fields
  }
}
```

**Error Responses:**
```json
// Not owner (403)
{
  "message": "Not authorized to update this booking"
}

// Booking expired (400)
{
  "message": "Booking request has expired"
}

// Rejection reason missing (400)
{
  "message": "Rejection reason is required"
}
```

---

## Backend Controllers & Models

### Vehicle Controller
**Location:** `backend/controllers/vehicleController.js`

#### addVehicle
```javascript
exports.addVehicle = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const { name, make, model, year, seats, location, 
            fuelType, image, plateNumber, pricePerDay, type } = req.body;

    // Validation
    if (!name || !make || !model || !year || !seats || 
        !location || !fuelType || pricePerDay === undefined || !type) {
      return res.status(400).json({ 
        message: "All fields are required" 
      });
    }

    // Get owner location from user profile
    const owner = await User.findById(userId).lean();
    const ownerLocation = owner?.city || owner?.address || null;

    // Create vehicle
    const vehicle = await Vehicle.create({
      name,
      make,
      model,
      year,
      seats,
      location,
      fuelType,
      pricePerDay,
      type,
      image: image || '/photos/default-car.jpg',
      plateNumber: plateNumber || null,
      owner: userId,
      ownerLocation
    });

    res.status(201).json({
      message: "Vehicle added successfully",
      vehicle
    });
  } catch (err) {
    console.error("Add vehicle error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
```

#### getAllVehicles
```javascript
exports.getAllVehicles = async (req, res) => {
  try {
    // Get all active vehicles
    const vehicles = await Vehicle.find({
      status: 'active'
    }).populate("owner", "name email");
    
    res.json({ vehicles });
  } catch (err) {
    console.error("Get all vehicles error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
```

#### getUserVehicles
```javascript
exports.getUserVehicles = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const vehicles = await Vehicle.find({ owner: userId });
    res.json({ vehicles });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
```

---

### Booking Controller
**Location:** `backend/controllers/bookingController.js`

#### getOwnerRequests
```javascript
exports.getOwnerRequests = async (req, res) => {
  try {
    const userId = req.userId;

    // Find all vehicles owned by user
    const userVehicles = await Vehicle.find({ owner: userId });
    const vehicleIds = userVehicles.map(v => v._id);

    // Find all bookings for these vehicles
    const bookings = await Booking.find({
      vehicle: { $in: vehicleIds }
    })
    .populate('user', 'name email phone')
    .populate('vehicle', 'name make model plateNumber image')
    .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (err) {
    console.error("Get owner requests error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
```

#### updateBookingStatus
```javascript
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, rejectionReason } = req.body;
    const userId = req.userId;

    // Find booking and populate vehicle owner
    const booking = await Booking.findById(bookingId)
      .populate('vehicle');

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify user is vehicle owner
    if (booking.vehicle.owner.toString() !== userId) {
      return res.status(403).json({ 
        message: "Not authorized to update this booking" 
      });
    }

    // Check if booking expired (48 hour window)
    if (new Date() > booking.expiresAt && status === 'CONFIRMED') {
      return res.status(400).json({ 
        message: "Booking request has expired" 
      });
    }

    // Validate rejection reason if rejecting
    if (status === 'REJECTED' && !rejectionReason) {
      return res.status(400).json({ 
        message: "Rejection reason is required" 
      });
    }

    // Update booking
    booking.status = status;
    if (rejectionReason) {
      booking.rejectionReason = rejectionReason;
    }
    await booking.save();

    res.json({
      message: `Booking ${status.toLowerCase()}`,
      booking
    });
  } catch (err) {
    console.error("Update booking status error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
```

---

### Vehicle Model
**Location:** `backend/models/Vehicle.js`

```javascript
const vehicleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  make: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  seats: {
    type: Number,
    required: true,
    min: 1
  },
  location: {
    type: String,
    required: true
  },
  fuelType: {
    type: String,
    required: true,
    enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG']
  },
  type: {
    type: String,
    enum: ['car', 'bike', 'scooter'],
    default: 'car'
  },
  image: {
    type: String,
    default: '/photos/default-car.jpg'
  },
  pricePerDay: {
    type: Number,
    required: true,
    min: 0
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  ownerLocation: {
    type: String,
    default: null
  },
  plateNumber: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: 0
  },
  completedBookings: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});
```

---

## Authentication & Authorization

### 1. Auth Middleware
**Location:** `backend/middleware/auth.js`

**Purpose:** Verifies JWT token and extracts user ID

```javascript
module.exports = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user ID to request object
    req.userId = decoded.userId;

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
```

**Usage in Routes:**
```javascript
router.post("/add", authMiddleware, addVehicle);
```

---

### 2. Verify User Middleware
**Location:** `backend/middleware/verifyUser.js`

**Purpose:** Ensures user account is verified before allowing certain actions

```javascript
const verifyUser = async (req, res, next) => {
  try {
    // Find user by ID (from auth middleware)
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check verification status
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: 'Account not verified. Please upload your citizenship document and wait for admin approval.',
        verificationStatus: user.verificationStatus,
        rejectionReason: user.rejectionReason
      });
    }

    next();
  } catch (error) {
    console.error('Verification check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
```

**Usage in Routes:**
```javascript
// Only verified users can add vehicles
router.post("/add", authMiddleware, verifyUser, addVehicle);

// Only verified users can create bookings
router.post("/", authMiddleware, verifyUser, createBooking);
```

**User Verification States:**
- `pending` - Document uploaded, awaiting admin review
- `approved` - Admin approved, `isVerified = true`
- `rejected` - Admin rejected, `rejectionReason` provided

---

### 3. Route Protection Patterns

#### Pattern 1: Public Access
```javascript
// Anyone can view vehicles
router.get("/", getAllVehicles);
```

#### Pattern 2: Authenticated Only
```javascript
// Must be logged in
router.get("/my-vehicles", authMiddleware, getUserVehicles);
```

#### Pattern 3: Authenticated + Verified
```javascript
// Must be logged in AND verified
router.post("/add", authMiddleware, verifyUser, addVehicle);
```

#### Pattern 4: Owner Authorization
```javascript
// Must be logged in and own the resource
router.patch("/:vehicleId/status", authMiddleware, async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.vehicleId);
  
  // Check ownership
  if (vehicle.owner.toString() !== req.userId) {
    return res.status(403).json({ message: "Not authorized" });
  }
  
  // Proceed with update...
});
```

---

## User Flow

### Complete Host Journey

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: User Navigates to "Become a Host"                   │
│                                                              │
│ Dashboard → Become Host Button → BecomeHostPage             │
│                                                              │
│ Three Options Presented:                                     │
│  1. Add Vehicle                                              │
│  2. Manage Vehicles                                          │
│  3. Rental Requests                                          │
└─────────────────────┬────────────────────────────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
    ▼                 ▼                 ▼
┌───────────┐   ┌────────────┐   ┌──────────────┐
│ Add       │   │ Manage     │   │ Rental       │
│ Vehicle   │   │ Vehicles   │   │ Requests     │
└───────────┘   └────────────┘   └──────────────┘


┌─────────────────────────────────────────────────────────────┐
│ Flow 1: Adding a Vehicle                                     │
└─────────────────────────────────────────────────────────────┘

1. User clicks "Add Vehicle"
   └─> Redirects to /add-vehicle

2. AddVehiclePage loads
   └─> Checks if user.isVerified
       ├─> If false: Shows verification warning
       └─> If true: Shows full form

3. User fills form:
   - Vehicle Name (e.g., "Honda Civic 2020")
   - Make (Honda)
   - Model (Civic)
   - Year (2020)
   - Seats (5)
   - Location (Kathmandu, Nepal)
   - Type (car/bike/scooter)
   - Fuel Type (Petrol/Diesel/Electric/Hybrid/CNG)
   - Plate Number (BA 12 PA 1234)
   - Price Per Day (Rs. 5000)
   - Image Upload

4. Image Upload Process:
   a. User selects image file
   b. Preview generated locally
   c. On submit:
      - Image uploaded to Cloudinary
      - Returns secure URL
      - URL included in form data

5. Form submission:
   POST /api/vehicles/add
   Headers: { Authorization: Bearer <token> }
   Body: { ...vehicleData, image: cloudinaryUrl }

6. Backend Processing:
   a. authMiddleware extracts userId from token
   b. verifyUser checks if user.isVerified
   c. Validates all required fields
   d. Creates vehicle document in MongoDB
   e. Links vehicle to user via owner field

7. Response:
   - Success: Vehicle created, redirect to /vehicles
   - Failure: Error message displayed


┌─────────────────────────────────────────────────────────────┐
│ Flow 2: Managing Vehicles                                    │
└─────────────────────────────────────────────────────────────┘

1. User clicks "Manage My Vehicles"
   └─> Redirects to /manage-vehicles

2. ManageVehiclesPage loads
   └─> Fetches user's vehicles
       GET /api/vehicles/my-vehicles
       Headers: { Authorization: Bearer <token> }

3. Backend Processing:
   a. authMiddleware extracts userId
   b. Finds all vehicles where owner === userId
   c. Returns array of vehicles (all statuses)

4. Simultaneously fetches active bookings:
   GET /api/bookings/rental-requests
   └─> Maps confirmed bookings to vehicle IDs

5. Vehicle Cards Display:
   For each vehicle:
   - Image
   - Name, make, model
   - Status badge (Active/Inactive)
   - Stats (rating, completed bookings)
   - Active booking indicator (if applicable)
   - Action buttons:
     * Toggle Status (Active ↔ Inactive)
     * Delete

6. Toggle Status Action:
   a. User clicks toggle button
   b. PATCH /api/vehicles/:id/status
      Body: { status: "inactive" }
   c. Backend verifies ownership
   d. Updates vehicle.status
   e. Frontend updates local state

7. Delete Action:
   a. User clicks delete button
   b. Check if vehicle has active booking
      ├─> If yes: Show error message
      └─> If no: Confirm deletion
   c. DELETE /api/vehicles/:id
   d. Backend verifies ownership
   e. Removes vehicle document
   f. Frontend removes from list


┌─────────────────────────────────────────────────────────────┐
│ Flow 3: Handling Rental Requests                             │
└─────────────────────────────────────────────────────────────┘

1. User clicks "Rental Requests"
   └─> Redirects to /rental-requests

2. RentalRequestsPage loads
   └─> Fetches rental requests
       GET /api/bookings/owner
       Headers: { Authorization: Bearer <token> }

3. Backend Processing:
   a. authMiddleware extracts userId
   b. Finds all vehicles owned by user
   c. Finds all bookings for these vehicles
   d. Populates user and vehicle details
   e. Sorts by creation date (newest first)

4. Request Cards Display:
   For each booking:
   - Renter information (name, email, phone)
   - Vehicle details
   - Booking dates (pickup → dropoff)
   - Total price
   - Status badge
   - Time remaining (for pending requests)
   - Action buttons (if pending):
     * Accept
     * Reject

5. Accept Request:
   a. User clicks "Accept" button
   b. PATCH /api/bookings/:id/status
      Body: { status: "CONFIRMED" }
   c. Backend:
      - Verifies ownership
      - Checks expiration (48 hour window)
      - Updates booking.status to CONFIRMED
   d. Renter notified (email/notification)
   e. Renter can proceed with payment

6. Reject Request:
   a. User clicks "Reject" button
   b. Rejection modal opens
   c. User enters rejection reason
   d. PATCH /api/bookings/:id/status
      Body: { 
        status: "REJECTED",
        rejectionReason: "Vehicle under maintenance"
      }
   e. Backend updates booking
   f. Renter notified with reason

7. Auto-refresh:
   - Page refreshes every 2 minutes
   - Ensures owner sees new requests promptly

8. Payment Workflow (Post-Confirmation):
   a. Booking status: CONFIRMED
   b. Renter redirected to payment page
   c. Payment processed
   d. Payment status: COMPLETED
   e. Vehicle becomes unavailable for booking period
   f. Owner sees "Awaiting Payment" indicator until paid
```

---

## Database Schema

### Vehicle Document Structure
```json
{
  "_id": ObjectId("60f7b3c7e4b0f83d4c8e9a12"),
  "name": "Honda Civic 2020",
  "make": "Honda",
  "model": "Civic",
  "year": 2020,
  "seats": 5,
  "location": "Kathmandu, Nepal",
  "fuelType": "Petrol",
  "type": "car",
  "image": "https://res.cloudinary.com/xyz/image/upload/v123/vehicles/civic.jpg",
  "pricePerDay": 5000,
  "owner": ObjectId("60f7b3c7e4b0f83d4c8e9a00"),
  "ownerLocation": "Kathmandu",
  "plateNumber": "BA 12 PA 1234",
  "status": "active",
  "rating": 4.5,
  "totalRatings": 12,
  "completedBookings": 8,
  "createdAt": "2024-01-28T10:30:00.000Z",
  "updatedAt": "2024-01-28T10:30:00.000Z"
}
```

### User Document Structure (Relevant Fields)
```json
{
  "_id": ObjectId("60f7b3c7e4b0f83d4c8e9a00"),
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+977-9812345678",
  "city": "Kathmandu",
  "address": "Thamel, Kathmandu",
  "isVerified": true,
  "verificationStatus": "approved",
  "citizenshipDocument": "https://cloudinary.com/.../citizenship.jpg",
  "rejectionReason": null
}
```

### Booking Document Structure
```json
{
  "_id": ObjectId("60f7b3c7e4b0f83d4c8e9b01"),
  "user": ObjectId("60f7b3c7e4b0f83d4c8e9a01"),
  "vehicle": ObjectId("60f7b3c7e4b0f83d4c8e9a12"),
  "pickupDate": "2024-02-01T00:00:00.000Z",
  "dropoffDate": "2024-02-05T00:00:00.000Z",
  "totalPrice": 20000,
  "status": "CONFIRMED",
  "paymentStatus": "COMPLETED",
  "rejectionReason": null,
  "expiresAt": "2024-01-30T10:30:00.000Z",
  "createdAt": "2024-01-28T10:30:00.000Z",
  "updatedAt": "2024-01-29T15:45:00.000Z"
}
```

---

## Key Features & Business Logic

### 1. Verification System
- Only verified users can add vehicles
- Verification requires:
  - Citizenship document upload
  - Admin review and approval
- Protects platform from fraudulent listings

### 2. Vehicle Status Management
- **Active**: Available for booking
- **Inactive**: Hidden from marketplace, not bookable
- Owners can toggle status anytime
- Prevents deletion if vehicle has active bookings

### 3. Booking Request Handling
- Owner has **48 hours** to respond to requests
- After expiration, booking auto-cancels
- Rejection requires reason for transparency
- Confirmed bookings must be paid within timeframe

### 4. Image Management
- Images stored on **Cloudinary CDN**
- Provides fast, scalable image delivery
- Automatic optimization and compression
- Default image if none uploaded

### 5. Revenue Tracking
- Each vehicle tracks:
  - Total completed bookings
  - Average rating
  - Total number of ratings
- Helps renters make informed decisions

### 6. Security Measures
- JWT token authentication
- Owner verification for updates/deletes
- Cannot delete vehicle with active bookings
- Booking expiration prevents stale requests

---

## Environment Variables Required

```env
# Backend (.env)
MONGODB_URI=mongodb://localhost:27017/ridesharex
JWT_SECRET=your_jwt_secret_key_here
PORT=5000

# Frontend (.env)
REACT_APP_API_URL=http://localhost:5000
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

---

## Error Handling

### Frontend Error Handling
```javascript
try {
  const res = await axios.post(url, data, { headers });
  // Success handling
} catch (err) {
  console.error("Error:", err);
  alert(err.response?.data?.message || "Operation failed");
}
```

### Backend Error Handling
```javascript
try {
  // Business logic
} catch (err) {
  console.error("Error:", err);
  res.status(500).json({ message: "Server error" });
}
```

### Common Error Codes
- **400** - Bad Request (validation failed)
- **401** - Unauthorized (no token or invalid token)
- **403** - Forbidden (not verified or not authorized)
- **404** - Not Found (resource doesn't exist)
- **500** - Internal Server Error

---

## Testing the System

### 1. Add Vehicle Test
```bash
# Request
curl -X POST http://localhost:5000/api/vehicles/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Vehicle",
    "make": "Honda",
    "model": "Civic",
    "year": 2020,
    "seats": 5,
    "location": "Kathmandu",
    "type": "car",
    "fuelType": "Petrol",
    "pricePerDay": 5000
  }'
```

### 2. Get User Vehicles Test
```bash
curl -X GET http://localhost:5000/api/vehicles/my-vehicles \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Toggle Status Test
```bash
curl -X PATCH http://localhost:5000/api/vehicles/VEHICLE_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{ "status": "inactive" }'
```

---

## Future Enhancements

1. **Real-time Notifications**
   - WebSocket integration for instant booking alerts
   - Push notifications for mobile app

2. **Advanced Analytics Dashboard**
   - Revenue tracking over time
   - Booking trends and insights
   - Performance metrics per vehicle

3. **Bulk Operations**
   - Upload multiple vehicles at once
   - Batch status updates

4. **Vehicle Availability Calendar**
   - Visual calendar showing booked dates
   - Block dates manually for maintenance

5. **Automated Pricing**
   - Dynamic pricing based on demand
   - Seasonal adjustments

6. **Review System**
   - Renters can rate vehicles
   - Owners can respond to reviews

---

## Support & Maintenance

### Logs to Monitor
- Vehicle creation logs
- Booking status changes
- Payment confirmations
- Error logs for failed operations

### Common Issues & Solutions

**Issue:** Image upload fails
- **Solution:** Verify Cloudinary credentials
- Check upload preset configuration
- Ensure file size < 10MB

**Issue:** User can't add vehicle
- **Solution:** Check verification status
- Verify JWT token is valid
- Check all required fields filled

**Issue:** Vehicle won't delete
- **Solution:** Check for active bookings
- Ensure user is the owner
- Verify vehicle ID is correct

---

## Conclusion

The "Become a Host" system provides a comprehensive vehicle management solution with:
- Secure authentication and authorization
- Verified user protection
- Intuitive UI for all host operations
- Real-time booking management
- Cloudinary integration for images
- Robust error handling
- Scalable architecture

All components work together seamlessly to provide a professional hosting experience on the RideShareX platform.

---

**Last Updated:** January 28, 2026  
**Version:** 1.0  
**Maintained by:** RideShareX Development Team
