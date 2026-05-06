# 🔄 API Workflow Guide - How Frontend & Backend Communicate

## 📖 Table of Contents
1. [What is an API?](#what-is-an-api)
2. [How API Calls Work](#how-api-calls-work)
3. [Complete API Flow Example](#complete-api-flow-example)
4. [API Structure in RideShareX](#api-structure-in-ridesharex)
5. [Creating a New API Endpoint](#creating-a-new-api-endpoint)
6. [API Request & Response Cycle](#api-request--response-cycle)

---

## 🤔 What is an API?

**API** stands for **Application Programming Interface**. Think of it as a **waiter in a restaurant**:

- **You (Frontend)** = Customer who orders food
- **Kitchen (Backend)** = Prepares the food
- **Waiter (API)** = Takes your order to the kitchen and brings back food

In RideShareX:
- **Frontend (React)** sends requests to the **Backend (Express)**
- **Backend** processes the request and talks to the **Database (MongoDB)**
- **Backend** sends back the response to **Frontend**
- **Frontend** displays the data to the user

---

## 🔄 How API Calls Work

### Step-by-Step Process

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │ ──(1)──→│   Backend   │ ──(2)──→│   MongoDB   │
│   (React)   │         │  (Express)  │         │  Database   │
│             │ ←──(4)──│             │ ←──(3)──│             │
└─────────────┘         └─────────────┘         └─────────────┘
```

**Step 1:** Frontend sends HTTP request (GET, POST, PUT, DELETE)  
**Step 2:** Backend queries the database  
**Step 3:** Database returns data  
**Step 4:** Backend sends JSON response to Frontend  

---

## 📦 Complete API Flow Example

Let's trace a **real example**: User booking a vehicle

### 1️⃣ **Frontend - User clicks "Book Now"**

File: `frontend/src/pages/vehicles/BookNowPage.jsx`

```javascript
const handleBooking = async () => {
  const response = await axios.post(
    'http://localhost:5000/api/bookings/create',
    {
      vehicleId: '12345',
      pickupDate: '2026-02-01',
      dropoffDate: '2026-02-05'
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  
  console.log(response.data); // { message: "Booking created", bookingId: "..." }
};
```

**What happens here?**
- Axios sends a **POST request** to the backend
- Includes **booking data** (vehicle, dates)
- Includes **JWT token** for authentication

---

### 2️⃣ **Backend - Route receives the request**

File: `backend/routes/booking.js`

```javascript
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');

// POST /api/bookings/create
router.post('/create', authMiddleware, bookingController.createBooking);

module.exports = router;
```

**What happens here?**
- Route listens for POST requests at `/api/bookings/create`
- **authMiddleware** verifies the JWT token
- Calls **createBooking** function in controller

---

### 3️⃣ **Middleware - Verifies Authentication**

File: `backend/middleware/auth.js`

```javascript
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Get token
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // Add userId to request
    next(); // Continue to controller
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
```

**What happens here?**
- Extracts JWT token from request headers
- Verifies token is valid
- Adds **userId** to request object
- Calls `next()` to continue to controller

---

### 4️⃣ **Controller - Business Logic**

File: `backend/controllers/bookingController.js`

```javascript
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');

exports.createBooking = async (req, res) => {
  try {
    const { vehicleId, pickupDate, dropoffDate } = req.body;
    const userId = req.userId; // From middleware
    
    // Check if vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    // Calculate total price
    const days = (new Date(dropoffDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24);
    const totalPrice = days * vehicle.pricePerDay;
    
    // Create booking in database
    const booking = await Booking.create({
      renter: userId,
      vehicle: vehicleId,
      pickupDate,
      dropoffDate,
      totalPrice,
      status: 'pending'
    });
    
    // Send response back to frontend
    res.status(201).json({
      message: 'Booking created successfully',
      bookingId: booking._id,
      totalPrice
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
```

**What happens here?**
- Validates the vehicle exists
- Calculates total price
- Saves booking to MongoDB
- Sends success response back to frontend

---

### 5️⃣ **Database - MongoDB stores the data**

```javascript
// Booking saved in MongoDB
{
  _id: "abc123",
  renter: "userId123",
  vehicle: "vehicleId456",
  pickupDate: "2026-02-01",
  dropoffDate: "2026-02-05",
  totalPrice: 2000,
  status: "pending",
  createdAt: "2026-01-31T10:00:00Z"
}
```

---

### 6️⃣ **Frontend - Receives Response**

```javascript
const handleBooking = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/bookings/create', {...});
    
    // Response received!
    console.log(response.data);
    // { message: "Booking created successfully", bookingId: "abc123", totalPrice: 2000 }
    
    alert('Booking successful!');
    navigate('/my-bookings');
    
  } catch (error) {
    console.error(error.response.data.message);
    alert('Booking failed!');
  }
};
```

**What happens here?**
- Frontend receives JSON response
- Shows success message to user
- Redirects to bookings page

---

## 🏗️ API Structure in RideShareX

### Backend API Routes

| Route | Method | Purpose | Authentication |
|-------|--------|---------|----------------|
| `/api/auth/google-login` | POST | Login with Google | ❌ Public |
| `/api/auth/profile` | GET | Get user profile | ✅ Required |
| `/api/auth/update-profile` | PUT | Update profile | ✅ Required |
| `/api/vehicles/add` | POST | Add new vehicle | ✅ Verified Host |
| `/api/vehicles/all` | GET | Get all vehicles | ❌ Public |
| `/api/vehicles/owner` | GET | Get my vehicles | ✅ Required |
| `/api/bookings/create` | POST | Create booking | ✅ Required |
| `/api/bookings/my-bookings` | GET | Get my bookings | ✅ Required |
| `/api/payment/demo` | POST | Process payment | ✅ Required |
| `/api/payment/user/history` | GET | Transaction history | ✅ Required |

---

## 🛠️ Creating a New API Endpoint

Let's create an API to **get vehicle details by ID**

### Step 1: Create Controller Function

File: `backend/controllers/vehicleController.js`

```javascript
exports.getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vehicle = await Vehicle.findById(id).populate('owner', 'name email');
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    res.status(200).json({ vehicle });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
```

### Step 2: Add Route

File: `backend/routes/vehicle.js`

```javascript
const vehicleController = require('../controllers/vehicleController');

// GET /api/vehicles/:id
router.get('/:id', vehicleController.getVehicleById);
```

### Step 3: Call API from Frontend

File: `frontend/src/services/apiService.js`

```javascript
export const getVehicleById = async (vehicleId) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/vehicles/${vehicleId}`);
    return response.data.vehicle;
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    throw error;
  }
};
```

### Step 4: Use in React Component

File: `frontend/src/pages/VehicleDetailPage.jsx`

```javascript
import { getVehicleById } from '../services/apiService';

function VehicleDetailPage() {
  const [vehicle, setVehicle] = useState(null);
  const { id } = useParams();
  
  useEffect(() => {
    const loadVehicle = async () => {
      const data = await getVehicleById(id);
      setVehicle(data);
    };
    loadVehicle();
  }, [id]);
  
  return <div>{vehicle?.name}</div>;
}
```

---

## 📊 API Request & Response Cycle

### HTTP Methods Used

| Method | Purpose | Example |
|--------|---------|---------|
| **GET** | Retrieve data | Get all vehicles |
| **POST** | Create new data | Create booking |
| **PUT** | Update existing data | Update profile |
| **DELETE** | Delete data | Delete vehicle |

### Request Structure

```javascript
{
  url: 'http://localhost:5000/api/bookings/create',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    'Content-Type': 'application/json'
  },
  body: {
    vehicleId: '12345',
    pickupDate: '2026-02-01',
    dropoffDate: '2026-02-05'
  }
}
```

### Response Structure

```javascript
{
  status: 201,
  data: {
    message: 'Booking created successfully',
    bookingId: 'abc123',
    totalPrice: 2000
  }
}
```

### Error Response

```javascript
{
  status: 404,
  data: {
    message: 'Vehicle not found'
  }
}
```

---

## 🔐 Authentication Flow

### How JWT Token Works

```
1. User logs in with Google
   ↓
2. Backend generates JWT token
   ↓
3. Frontend stores token in localStorage
   ↓
4. Every API call includes token in headers
   ↓
5. Backend verifies token before processing request
```

### Example with Token

**Login Response:**
```javascript
{
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  user: { id: '123', name: 'John', email: 'john@example.com' }
}
```

**Subsequent Requests:**
```javascript
axios.get('/api/bookings/my-bookings', {
  headers: {
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
});
```

---

## 📝 Summary

1. **Frontend** sends HTTP request using Axios
2. **Backend Route** receives request
3. **Middleware** validates authentication
4. **Controller** processes business logic
5. **Model** interacts with MongoDB
6. **Response** sent back to Frontend
7. **Frontend** displays data to user

**Remember:** Every API follows this same pattern! 🚀
