# Vehicle Management System Documentation

## Overview
This document explains how vehicles are added, stored, retrieved, and displayed in RideShareX. It covers the complete flow from adding a vehicle to viewing it on different pages.

---

## Table of Contents
1. [Database Schema](#database-schema)
2. [API Endpoints](#api-endpoints)
3. [Adding a Vehicle](#adding-a-vehicle)
4. [Viewing All Vehicles](#viewing-all-vehicles)
5. [Managing Owner's Vehicles](#managing-owners-vehicles)
6. [Vehicle Ownership & Display Logic](#vehicle-ownership--display-logic)

---

## Database Schema

### Vehicle Model (`backend/models/Vehicle.js`)

The vehicle is stored in MongoDB with the following structure:

```javascript
{
  // Basic Information
  name: String (required)           // e.g., "Toyota Corolla"
  make: String (required)           // e.g., "Toyota"
  model: String (required)          // e.g., "Corolla"
  year: Number (required)           // e.g., 2020
  seats: Number (required, min: 1)  // e.g., 4
  location: String (required)       // e.g., "Kathmandu"
  
  // Vehicle Details
  fuelType: String (required)       // Options: 'Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'
  type: String (default: 'car')     // Options: 'car', 'bike', 'scooter'
  plateNumber: String               // Vehicle registration number (optional)
  
  // Media & Pricing
  image: String                     // Cloudinary URL or default image
  pricePerDay: Number (required)    // Rental price per day
  
  // Ownership & Location
  owner: ObjectId (required)        // Reference to User model
  ownerLocation: String             // Owner's city/address
  
  // Status & Activity
  status: String                    // Options: 'active', 'inactive' (default: 'active')
  
  // Rating System
  rating: Number (0-5, default: 0)
  totalRatings: Number (default: 0)
  completedBookings: Number (default: 0)
  
  // Timestamps
  createdAt: Date (auto-generated)
  updatedAt: Date (auto-generated)
}
```

**Important Fields Explained:**
- **owner**: Links the vehicle to the user who added it (used to check ownership)
- **status**: Controls visibility in public marketplace (only 'active' vehicles are shown)
- **ownerLocation**: Extracted from user profile for location-based filtering
- **image**: Uploaded to Cloudinary during vehicle creation

---

## API Endpoints

### 1. **Add Vehicle** (Protected)
**Endpoint:** `POST /api/vehicles/add`  
**Authentication:** Required (JWT Token)  
**Authorization:** User must be verified (citizenship document approved)  
**Middleware:** `authMiddleware`, `verifyUser`

**Request Body:**
```json
{
  "name": "Toyota Corolla 2020",
  "make": "Toyota",
  "model": "Corolla",
  "year": 2020,
  "seats": 4,
  "location": "Kathmandu",
  "fuelType": "Petrol",
  "type": "car",
  "plateNumber": "BA 1 PA 1234",
  "pricePerDay": 3000,
  "image": "https://res.cloudinary.com/..."
}
```

**Response:**
```json
{
  "message": "Vehicle added successfully",
  "vehicle": { /* vehicle object */ }
}
```

**Process:**
1. Middleware extracts `userId` from JWT token
2. Verifies user's account status (must be verified)
3. Fetches owner's location from User model
4. Creates new vehicle document with owner ID
5. Returns created vehicle

---

### 2. **Get All Vehicles** (Public)
**Endpoint:** `GET /api/vehicles`  
**Authentication:** Not required  
**Returns:** All active vehicles

**Response:**
```json
{
  "success": true,
  "vehicles": [
    {
      "_id": "...",
      "name": "Toyota Corolla 2020",
      "owner": {
        "_id": "...",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "status": "active",
      // ... other fields
    }
  ]
}
```

**Process:**
1. Queries database for vehicles with `status: "active"`
2. Populates owner information (name, email)
3. Returns array of vehicles

**Note:** This endpoint ONLY returns active vehicles, so users can't see inactive vehicles in the marketplace.

---

### 3. **Get My Vehicles** (Protected)
**Endpoint:** `GET /api/vehicles/my-vehicles`  
**Authentication:** Required (JWT Token)  
**Returns:** All vehicles owned by current user (all statuses)

**Response:**
```json
{
  "success": true,
  "vehicles": [ /* owner's vehicles */ ]
}
```

**Process:**
1. Extracts `userId` from JWT token
2. Queries database for vehicles where `owner` matches `userId`
3. Returns all vehicles (active and inactive)

---

### 4. **Update Vehicle Status** (Protected)
**Endpoint:** `PATCH /api/vehicles/:vehicleId/status`  
**Authentication:** Required (JWT Token)  
**Authorization:** Must be vehicle owner

**Request Body:**
```json
{
  "status": "inactive"  // or "active"
}
```

**Process:**
1. Verifies ownership (vehicle.owner === userId)
2. Updates vehicle status
3. Returns updated vehicle

---

### 5. **Delete Vehicle** (Protected)
**Endpoint:** `DELETE /api/vehicles/:vehicleId`  
**Authentication:** Required (JWT Token)  
**Authorization:** Must be vehicle owner

**Process:**
1. Verifies ownership
2. Deletes vehicle from database
3. Returns success message

---

## Adding a Vehicle

### Frontend Flow (`frontend/src/pages/vehicles/AddVehiclePage.jsx`)

#### Step 1: User Fills Form
User provides:
- Vehicle name, make, model, year
- Seats, location, fuel type, vehicle type
- Price per day
- Plate number (optional)
- Vehicle image (optional)

#### Step 2: Image Upload to Cloudinary
If user selects an image:
1. Image file is uploaded to Cloudinary using their API
2. Cloudinary returns secure URL
3. URL is stored in the database

```javascript
const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  const data = await response.json();
  return data.secure_url;
};
```

#### Step 3: Submit to Backend
```javascript
const res = await axios.post("http://localhost:5000/api/vehicles/add", {
  ...vehicleData,
  year: parseInt(vehicleData.year),
  seats: parseInt(vehicleData.seats),
  pricePerDay: parseInt(vehicleData.pricePerDay),
  image: imageUrl  // Cloudinary URL or default
}, {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

#### Step 4: Backend Processing
1. **Authentication Check:** Middleware verifies JWT token
2. **Verification Check:** `verifyUser` middleware ensures user has approved citizenship document
3. **Owner Location:** Fetches user's city/address from User model
4. **Create Vehicle:** Saves vehicle with owner ID from token
5. **Response:** Returns created vehicle

#### Step 5: Redirect
User is redirected to `/vehicles` page after successful creation.

---

## Viewing All Vehicles

### Frontend: Vehicles Marketplace (`frontend/src/pages/VehiclesPage.jsx`)

#### Data Fetching
```javascript
const res = await axios.get("http://localhost:5000/api/vehicles");
```

#### Vehicle Display Logic
1. **Fetch all active vehicles** from backend
2. **Map and format** vehicle data for display
3. **Handle images:**
   - Use Cloudinary URL if available
   - Fallback to Unsplash placeholder if default image

```javascript
image: v.image && v.image !== '/photos/default-car.jpg' 
  ? v.image  // Use actual Cloudinary URL
  : "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500"  // Fallback
```

#### Filtering & Sorting
Users can filter by:
- **Location:** Shows only vehicles in selected city
- **Vehicle Type:** car, bike, or scooter
- **Sort Options:**
  - Recommended (for logged-in users)
  - Price (low to high / high to low)
  - Rating

#### Display Information
Each vehicle card shows:
- Vehicle image
- Name, make, model, year
- Price per day
- Location
- Seats
- Fuel type
- Rating (if available)

---

## Managing Owner's Vehicles

### Frontend: Manage Vehicles Page (`frontend/src/pages/vehicles/ManageVehiclesPage.jsx`)

This page is for vehicle owners to manage their listed vehicles.

#### Data Fetching
```javascript
const res = await axios.get("http://localhost:5000/api/vehicles/my-vehicles", {
  headers: { Authorization: `Bearer ${token}` }
});
```

#### How It Works
1. **Fetch owner's vehicles:** Uses JWT token to get only current user's vehicles
2. **Display all statuses:** Shows both active and inactive vehicles
3. **Check active bookings:** Displays if a vehicle is currently rented

#### Features for Owners
1. **Toggle Status:**
   - Switch between 'active' (visible in marketplace) and 'inactive' (hidden)
   - API call: `PATCH /api/vehicles/:id/status`

2. **Delete Vehicle:**
   - Remove vehicle from database
   - Blocked if vehicle has active rental
   - API call: `DELETE /api/vehicles/:id`

3. **View Active Rentals:**
   - Shows if vehicle is currently booked
   - Displays renter information
   - Shows rental dates

---

## Vehicle Ownership & Display Logic

### How Ownership is Determined

#### 1. **During Vehicle Creation**
- User's ID is extracted from JWT token by `authMiddleware`
- `owner` field is set to this user ID
```javascript
owner: userId  // From JWT token
```

#### 2. **Backend Verification**
Every protected vehicle operation checks ownership:
```javascript
if (vehicle.owner.toString() !== userId) {
  return res.status(403).json({ message: "Not authorized" });
}
```

### Display Logic by Page

#### **Vehicles Marketplace** (`/vehicles`)
- Shows ALL active vehicles from ALL users
- No ownership check required (public page)
- Cannot see inactive vehicles
- Cannot distinguish own vehicles from others in the listing

#### **Manage Vehicles Page** (`/manage-vehicles`)
- Shows ONLY current user's vehicles (ownership filter applied)
- Query: `Vehicle.find({ owner: userId })`
- Shows both active and inactive vehicles
- Allows full CRUD operations on owned vehicles

#### **Dashboard** (`/dashboard`)
- If user is a host, shows their vehicles count
- Quick navigation to manage vehicles

---

## Complete Flow Example

### Scenario: John adds a new car

1. **John navigates to** `/add-vehicle`
2. **Verification check:** System checks if John's citizenship document is approved
3. **John fills form:**
   - Name: "Honda City 2022"
   - Make: Honda, Model: City, Year: 2022
   - Seats: 4, Location: Kathmandu
   - Type: car, Fuel: Petrol
   - Price: ₹3500/day
   - Uploads image

4. **Image upload:**
   - Image sent to Cloudinary
   - Returns URL: `https://res.cloudinary.com/ridesharex/image/upload/v123/car123.jpg`

5. **Submit to backend:**
   - JWT token sent in Authorization header
   - Middleware extracts John's user ID
   - Creates vehicle document:
   ```javascript
   {
     name: "Honda City 2022",
     make: "Honda",
     model: "City",
     year: 2022,
     owner: "john_user_id",  // From token
     image: "https://res.cloudinary.com/...",
     status: "active",
     // ... other fields
   }
   ```

6. **Vehicle saved in database**
7. **John redirected to** `/vehicles` marketplace
8. **John's car appears in:**
   - Public marketplace (because status is 'active')
   - John's manage vehicles page (because owner is John)

### Scenario: Sarah views vehicles

1. **Sarah navigates to** `/vehicles`
2. **Backend returns:**
   - All vehicles with `status: "active"`
   - Including John's Honda City
   - With populated owner information

3. **Sarah sees:**
   - Vehicle image from Cloudinary
   - Price, location, specs
   - Owner name: "John Doe"

4. **Sarah cannot:**
   - See inactive vehicles
   - Edit or delete vehicles she doesn't own
   - See owner's private information (only name/email shown)

### Scenario: John manages his vehicles

1. **John navigates to** `/manage-vehicles`
2. **Backend query:** `Vehicle.find({ owner: john_user_id })`
3. **Returns only John's vehicles** (even inactive ones)
4. **John can:**
   - Toggle status (active ↔ inactive)
   - Delete vehicle (if not currently rented)
   - See active rental information
5. **If John makes vehicle inactive:**
   - Still visible in his manage page
   - Disappears from public marketplace
   - Sarah can no longer see it in `/vehicles`

---

## Key Security Features

### 1. **Authentication (JWT Token)**
- All vehicle operations require valid token
- Token contains user ID
- Prevents unauthorized access

### 2. **Ownership Verification**
- Backend checks `vehicle.owner === userId`
- Users can only modify their own vehicles
- Prevents unauthorized updates/deletes

### 3. **User Verification**
- Only verified users can add vehicles
- Requires approved citizenship document
- Middleware: `verifyUser`

### 4. **Status-Based Visibility**
- Public marketplace shows only active vehicles
- Owners see all their vehicles (any status)
- Inactive vehicles hidden from public

---

## API Response Examples

### Get All Vehicles Response
```json
{
  "success": true,
  "vehicles": [
    {
      "_id": "65abc123...",
      "name": "Toyota Corolla 2020",
      "make": "Toyota",
      "model": "Corolla",
      "year": 2020,
      "seats": 4,
      "location": "Kathmandu",
      "fuelType": "Petrol",
      "type": "car",
      "image": "https://res.cloudinary.com/...",
      "pricePerDay": 3000,
      "status": "active",
      "owner": {
        "_id": "65abc456...",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "rating": 4.5,
      "totalRatings": 10,
      "completedBookings": 15,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T15:45:00Z"
    }
  ]
}
```

### Get My Vehicles Response
```json
{
  "success": true,
  "vehicles": [
    {
      "_id": "65abc123...",
      "name": "My Honda City",
      "status": "active",
      "owner": "65abc456...",
      // ... all vehicle fields
    },
    {
      "_id": "65abc789...",
      "name": "My Old Bike",
      "status": "inactive",  // Also shown in my-vehicles
      "owner": "65abc456...",
      // ... all vehicle fields
    }
  ]
}
```

---

## Summary

### Vehicle Addition Flow
1. User fills form with vehicle details
2. (Optional) Image uploaded to Cloudinary
3. Data sent to backend with JWT token
4. Backend verifies user and creates vehicle with owner ID
5. Vehicle saved in database with status 'active'

### Vehicle Retrieval Flow
1. **Public marketplace:** Fetches all active vehicles
2. **Owner's page:** Fetches vehicles where owner matches user ID
3. Frontend displays with images, pricing, and vehicle details

### Ownership Display
- **In marketplace:** All active vehicles shown (public)
- **In manage page:** Only owner's vehicles shown (filtered by owner ID)
- **Status toggle:** Owner can make vehicles active/inactive
- **Active:** Visible in public marketplace
- **Inactive:** Hidden from public, only visible to owner


This system ensures proper authorization, data security, and clear separation between public and private vehicle management.

