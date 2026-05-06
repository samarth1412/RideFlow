# 📡 API Endpoints Reference - RideShareX

## 📋 Complete API Documentation

This document lists all available API endpoints in RideShareX with examples of how to use them.

---

## 🔐 Authentication APIs

### 1. Google Login/Signup
**Endpoint:** `POST /api/auth/google-login`  
**Description:** Login or create account using Google OAuth  
**Authentication:** Not required  

**Request Body:**
```json
{
  "googleId": "1234567890",
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://example.com/photo.jpg"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "isProfileComplete": true,
    "isVerified": false
  }
}
```

---

### 2. Get User Profile
**Endpoint:** `GET /api/auth/profile`  
**Description:** Get current user's profile data  
**Authentication:** Required (JWT Token)  

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "_id": "abc123",
    "name": "John Doe",
    "email": "user@example.com",
    "phone": "1234567890",
    "address": "123 Main St",
    "city": "New York",
    "isVerified": true,
    "isProfileComplete": true,
    "picture": "https://example.com/photo.jpg"
  }
}
```

---

### 3. Update Profile
**Endpoint:** `PUT /api/auth/update-profile`  
**Description:** Update user profile details  
**Authentication:** Required (JWT Token)  

**Request Body:**
```json
{
  "phone": "9876543210",
  "address": "456 Oak Ave",
  "city": "Los Angeles",
  "state": "CA",
  "pincode": "90001"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "_id": "abc123",
    "phone": "9876543210",
    "address": "456 Oak Ave",
    "isProfileComplete": true
  }
}
```

---

### 4. Apply to Become Host
**Endpoint:** `POST /api/auth/apply-host`  
**Description:** User applies to become a verified host  
**Authentication:** Required (JWT Token)  

**Request Body:**
```json
{
  "licenseNumber": "DL123456789",
  "experience": "5 years",
  "reason": "I want to rent out my vehicle"
}
```

**Response:**
```json
{
  "message": "Host application submitted",
  "status": "pending"
}
```

---

## 🚗 Vehicle APIs

### 1. Get All Vehicles
**Endpoint:** `GET /api/vehicles/all`  
**Description:** Get all available vehicles  
**Authentication:** Not required  

**Response:**
```json
{
  "vehicles": [
    {
      "_id": "vehicle123",
      "name": "Toyota Camry",
      "make": "Toyota",
      "model": "Camry",
      "year": 2022,
      "seats": 5,
      "location": "New York",
      "fuelType": "Petrol",
      "pricePerDay": 500,
      "type": "Sedan",
      "image": "/photos/camry.jpg",
      "plateNumber": "ABC123",
      "owner": {
        "_id": "user123",
        "name": "John Doe"
      }
    }
  ]
}
```

---

### 2. Add New Vehicle
**Endpoint:** `POST /api/vehicles/add`  
**Description:** Add a new vehicle (Verified hosts only)  
**Authentication:** Required (JWT Token + Verified Host)  

**Request Body:**
```json
{
  "name": "Honda Civic",
  "make": "Honda",
  "model": "Civic",
  "year": 2023,
  "seats": 5,
  "location": "Los Angeles",
  "fuelType": "Petrol",
  "pricePerDay": 450,
  "type": "Sedan",
  "plateNumber": "XYZ789",
  "image": "/photos/civic.jpg"
}
```

**Response:**
```json
{
  "message": "Vehicle added successfully",
  "vehicle": {
    "_id": "vehicle456",
    "name": "Honda Civic",
    "pricePerDay": 450,
    "owner": "user123"
  }
}
```

---

### 3. Get My Vehicles
**Endpoint:** `GET /api/vehicles/owner`  
**Description:** Get all vehicles owned by current user  
**Authentication:** Required (JWT Token)  

**Response:**
```json
{
  "vehicles": [
    {
      "_id": "vehicle123",
      "name": "Toyota Camry",
      "pricePerDay": 500,
      "isAvailable": true,
      "totalBookings": 12
    }
  ]
}
```

---

### 4. Update Vehicle
**Endpoint:** `PUT /api/vehicles/:id`  
**Description:** Update vehicle details  
**Authentication:** Required (JWT Token + Owner)  

**Request Body:**
```json
{
  "pricePerDay": 550,
  "isAvailable": true,
  "location": "San Francisco"
}
```

**Response:**
```json
{
  "message": "Vehicle updated successfully",
  "vehicle": {
    "_id": "vehicle123",
    "pricePerDay": 550,
    "location": "San Francisco"
  }
}
```

---

### 5. Delete Vehicle
**Endpoint:** `DELETE /api/vehicles/:id`  
**Description:** Delete a vehicle  
**Authentication:** Required (JWT Token + Owner)  

**Response:**
```json
{
  "message": "Vehicle deleted successfully"
}
```

---

## 📅 Booking APIs

### 1. Create Booking
**Endpoint:** `POST /api/bookings/create`  
**Description:** Create a new booking request  
**Authentication:** Required (JWT Token)  

**Request Body:**
```json
{
  "vehicleId": "vehicle123",
  "pickupDate": "2026-02-01",
  "dropoffDate": "2026-02-05",
  "pickupTime": "10:00 AM",
  "dropoffTime": "10:00 AM"
}
```

**Response:**
```json
{
  "message": "Booking created successfully",
  "booking": {
    "_id": "booking123",
    "totalPrice": 2000,
    "status": "pending"
  }
}
```

---

### 2. Get My Bookings
**Endpoint:** `GET /api/bookings/my-bookings`  
**Description:** Get all bookings made by current user  
**Authentication:** Required (JWT Token)  

**Response:**
```json
{
  "bookings": [
    {
      "_id": "booking123",
      "vehicle": {
        "_id": "vehicle123",
        "name": "Toyota Camry",
        "image": "/photos/camry.jpg"
      },
      "pickupDate": "2026-02-01",
      "dropoffDate": "2026-02-05",
      "totalPrice": 2000,
      "status": "confirmed"
    }
  ]
}
```

---

### 3. Get Rental Requests
**Endpoint:** `GET /api/bookings/rental-requests`  
**Description:** Get booking requests for host's vehicles  
**Authentication:** Required (JWT Token + Verified Host)  

**Response:**
```json
{
  "requests": [
    {
      "_id": "booking456",
      "renter": {
        "_id": "user789",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "vehicle": {
        "_id": "vehicle123",
        "name": "Toyota Camry"
      },
      "pickupDate": "2026-02-10",
      "dropoffDate": "2026-02-15",
      "totalPrice": 2500,
      "status": "pending"
    }
  ]
}
```

---

### 4. Accept/Reject Booking
**Endpoint:** `PATCH /api/bookings/:id/status`  
**Description:** Accept or reject a booking request  
**Authentication:** Required (JWT Token + Vehicle Owner)  

**Request Body:**
```json
{
  "status": "confirmed"
}
```
or
```json
{
  "status": "rejected",
  "reason": "Vehicle not available on those dates"
}
```

**Response:**
```json
{
  "message": "Booking confirmed successfully",
  "booking": {
    "_id": "booking456",
    "status": "confirmed"
  }
}
```

---

## 💳 Payment APIs

### 1. Process Payment
**Endpoint:** `POST /api/payment/demo`  
**Description:** Process payment for a booking (demo mode)  
**Authentication:** Required (JWT Token)  

**Request Body:**
```json
{
  "bookingId": "booking123",
  "paymentMethod": "credit_card",
  "amount": 2000
}
```

**Response:**
```json
{
  "message": "Payment successful",
  "payment": {
    "_id": "payment123",
    "transactionId": "TXN123456",
    "amount": 2000,
    "status": "success"
  }
}
```

---

### 2. Get Transaction History
**Endpoint:** `GET /api/payment/user/history`  
**Description:** Get user's payment history  
**Authentication:** Required (JWT Token)  

**Response:**
```json
{
  "payments": [
    {
      "_id": "payment123",
      "booking": {
        "_id": "booking123",
        "vehicle": {
          "name": "Toyota Camry"
        }
      },
      "amount": 2000,
      "paymentMethod": "credit_card",
      "status": "success",
      "transactionId": "TXN123456",
      "createdAt": "2026-01-31T10:00:00Z"
    }
  ]
}
```

---

## 🎯 Recommendation APIs

### 1. Get Vehicle Recommendations
**Endpoint:** `POST /api/recommendations`  
**Description:** Get personalized vehicle recommendations  
**Authentication:** Required (JWT Token)  

**Request Body:**
```json
{
  "preferences": {
    "priceRange": [300, 600],
    "location": "New York",
    "fuelType": "Petrol",
    "seats": 5
  }
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "_id": "vehicle123",
      "name": "Toyota Camry",
      "pricePerDay": 500,
      "location": "New York",
      "matchScore": 95
    },
    {
      "_id": "vehicle456",
      "name": "Honda Civic",
      "pricePerDay": 450,
      "location": "New York",
      "matchScore": 88
    }
  ]
}
```

---

## 🛡️ Admin APIs

### 1. Get Verification Requests
**Endpoint:** `GET /api/auth/verification-requests`  
**Description:** Get all pending host verification requests  
**Authentication:** Required (JWT Token + Admin)  

**Response:**
```json
{
  "requests": [
    {
      "_id": "user789",
      "name": "John Doe",
      "email": "john@example.com",
      "licenseNumber": "DL123456789",
      "applicationDate": "2026-01-30T10:00:00Z"
    }
  ]
}
```

---

### 2. Approve/Reject Host
**Endpoint:** `PATCH /api/auth/verify-user/:id`  
**Description:** Approve or reject host application  
**Authentication:** Required (JWT Token + Admin)  

**Request Body:**
```json
{
  "isVerified": true
}
```

**Response:**
```json
{
  "message": "User verified successfully"
}
```

---

## 🔧 Error Responses

All API errors follow this format:

### 400 Bad Request
```json
{
  "message": "All fields are required"
}
```

### 401 Unauthorized
```json
{
  "message": "Invalid token"
}
```

### 403 Forbidden
```json
{
  "message": "Only verified hosts can add vehicles"
}
```

### 404 Not Found
```json
{
  "message": "Vehicle not found"
}
```

### 500 Server Error
```json
{
  "message": "Server error"
}
```

---

## 📝 Notes

- All authenticated routes require JWT token in headers: `Authorization: Bearer <token>`
- Date format: `YYYY-MM-DD`
- Time format: `HH:MM AM/PM`
- All responses are in JSON format
- Base URL for all endpoints: `http://localhost:5000` (development)

---

**Happy Coding! 🚀**
