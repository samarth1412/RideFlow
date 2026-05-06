# RideShareX - Booking and Payment System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Booking Request System](#booking-request-system)
3. [Booking Status Management](#booking-status-management)
4. [Payment Processing](#payment-processing)
5. [Money Flow and Calculations](#money-flow-and-calculations)
6. [Refund System](#refund-system)
7. [API Endpoints](#api-endpoints)

---

## Overview

The RideShareX platform implements a comprehensive booking and payment system that facilitates vehicle rental transactions between vehicle owners (hosts) and renters (users). The system handles:

- **Booking Requests**: Time-limited rental requests with automatic expiration
- **Status Management**: Accept/Reject workflow with proper authorization
- **Payment Processing**: Demo wallet-based transactions with fare breakdowns
- **Money Adjustment**: Automatic wallet transfers between users
- **Transaction History**: Complete audit trail with booking snapshots

---

## Booking Request System

### 1. Creating a Booking Request

**Endpoint**: `POST /api/booking/`  
**Access**: Private (Authenticated & Verified Users)

#### Process Flow:

```
User → Selects Vehicle → Chooses Dates → Sends Request → Owner Receives Request
```

#### Validation Checks:

1. **Required Fields Validation**:
   - Vehicle ID
   - Pickup Date
   - Dropoff Date
   - Total Days
   - Price Per Day
   - Total Price

2. **Vehicle Availability Checks**:
   - Vehicle must exist
   - Vehicle status must be "active"
   - User cannot book their own vehicle
   - No overlapping bookings (PENDING/CONFIRMED) for same dates

3. **Booking Expiration**:
   - Each booking request expires in **5 minutes**
   - Calculated as: `expiresAt = Date.now() + 5 * 60 * 1000`
   - Automatic expiration prevents indefinite pending states

#### Request Body Example:

```json
{
  "vehicleId": "60d5ec49f1b2c8b1f8e4e1a1",
  "pickupDate": "2026-02-01T10:00:00.000Z",
  "dropoffDate": "2026-02-05T10:00:00.000Z",
  "totalDays": 4,
  "pricePerDay": 2500,
  "totalPrice": 10000,
  "message": "Need the vehicle for a business trip"
}
```

#### Response:

```json
{
  "success": true,
  "message": "Booking request sent successfully",
  "booking": {
    "_id": "60d5ec49f1b2c8b1f8e4e1a2",
    "user": {
      "_id": "60d5ec49f1b2c8b1f8e4e1a3",
      "name": "John Doe",
      "email": "john@example.com",
      "picture": "..."
    },
    "vehicle": {
      "_id": "60d5ec49f1b2c8b1f8e4e1a1",
      "name": "Toyota Corolla",
      "make": "Toyota",
      "model": "Corolla",
      "year": 2022,
      "image": "...",
      "location": "Kathmandu"
    },
    "owner": {
      "_id": "60d5ec49f1b2c8b1f8e4e1a4",
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "pickupDate": "2026-02-01T10:00:00.000Z",
    "dropoffDate": "2026-02-05T10:00:00.000Z",
    "totalDays": 4,
    "pricePerDay": 2500,
    "totalPrice": 10000,
    "status": "PENDING",
    "expiresAt": "2026-01-30T12:35:00.000Z",
    "message": "Need the vehicle for a business trip"
  }
}
```

---

## Booking Status Management

### Booking Status Flow

```
PENDING → CONFIRMED → Payment → COMPLETED
   ↓           ↓
REJECTED   CANCELLED
   ↓           ↓
EXPIRED    EXPIRED
```

### Status Definitions:

| Status | Description | Can Pay? | Auto-Transition? |
|--------|-------------|----------|------------------|
| **PENDING** | Awaiting owner approval | No | Yes (→ EXPIRED after 5 min) |
| **CONFIRMED** | Owner accepted request | Yes | No |
| **REJECTED** | Owner declined request | No | No |
| **EXPIRED** | Timeout reached (5 min) | No | Yes (automatic) |
| **CANCELLED** | User cancelled booking | No | No |
| **COMPLETED** | Rental finished | N/A | No |

### 2. Owner Accepts/Rejects Booking

**Endpoint**: `PATCH /api/booking/:bookingId/status`  
**Access**: Private (Vehicle Owner Only)

#### Accept Booking:

```json
{
  "status": "CONFIRMED"
}
```

**What Happens**:
1. Booking status changes from PENDING → CONFIRMED
2. Expiration timer is cleared
3. User receives confirmation
4. User can now proceed to payment
5. Vehicle remains available until payment is completed

#### Reject Booking:

```json
{
  "status": "REJECTED",
  "rejectionReason": "Vehicle is needed for personal use during these dates"
}
```

**What Happens**:
1. Booking status changes from PENDING → REJECTED
2. Rejection reason is stored
3. User is notified
4. Vehicle becomes available for other bookings

#### Authorization Checks:
- Only the vehicle owner can update booking status
- Only PENDING bookings can be updated
- Cannot update EXPIRED bookings

#### Response Example:

```json
{
  "success": true,
  "message": "Booking confirmed successfully",
  "booking": {
    "_id": "60d5ec49f1b2c8b1f8e4e1a2",
    "status": "CONFIRMED",
    "user": {...},
    "vehicle": {...},
    "owner": {...}
  }
}
```

### 3. User Cancels Booking

**Endpoint**: `PATCH /api/booking/:bookingId/cancel`  
**Access**: Private (Booking User Only)

**Allowed For**:
- PENDING bookings (before owner responds)
- CONFIRMED bookings (after acceptance, before payment)

**Not Allowed For**:
- REJECTED, EXPIRED, CANCELLED, or COMPLETED bookings

#### Request:
```
PATCH /api/booking/60d5ec49f1b2c8b1f8e4e1a2/cancel
```

#### Response:
```json
{
  "success": true,
  "message": "Booking cancelled successfully"
}
```

### 4. Automatic Expiration System

**Runs Before**: Every `getUserBookings()` and `getOwnerRequests()` call

**Logic**:
```javascript
await Booking.updateMany(
  {
    status: 'PENDING',
    expiresAt: { $lt: new Date() }
  },
  { status: 'EXPIRED' }
);
```

**Purpose**:
- Prevents stale pending bookings
- Frees up vehicles automatically
- Ensures timely owner responses

---

## Payment Processing

### Payment Flow

```
Booking CONFIRMED → User Initiates Payment → Validation → Wallet Transfer → 
Vehicle Marked Inactive → Payment Record Created → Booking Updated
```

### 1. Process Demo Payment

**Endpoint**: `POST /api/payment/demo`  
**Access**: Private (Booking User Only)

#### Request Body:

```json
{
  "bookingId": "60d5ec49f1b2c8b1f8e4e1a2",
  "paymentMethod": "Demo Wallet",
  "amount": 10000
}
```

#### Payment Validation:

1. **Booking Validations**:
   - Booking must exist
   - User must be the booking creator
   - Booking status must be CONFIRMED
   - Payment status must not be COMPLETED (prevent double payment)

2. **Wallet Validations** (for Demo Wallet):
   - User must have sufficient balance
   - Owner account must exist

3. **Authorization**:
   - Only the booking user can make payment
   - Cannot pay for other users' bookings

#### Payment Processing Steps:

**Step 1: Calculate Fare Breakdown**
```javascript
const totalPrice = booking.totalPrice;  // e.g., 10000
const baseFare = Math.floor(totalPrice * 0.7);     // 70% = 7000
const distanceFare = Math.floor(totalPrice * 0.2); // 20% = 2000
const serviceFee = totalPrice - baseFare - distanceFare; // 10% = 1000
```

**Step 2: Simulate Processing**
- Adds 2-3 second delay to simulate real payment gateway
- Demo mode: Always succeeds (can be configured for 90% success rate)

**Step 3: Wallet Transfer** (if payment method is "Demo Wallet")
```javascript
// Deduct from user's wallet
user.walletBalance -= totalPrice;
await user.save();

// Add to owner's wallet
owner.walletBalance += totalPrice;
await owner.save();
```

**Step 4: Generate Transaction ID**
```javascript
const transactionId = `DEMO-${timestamp}-${random}`;
// Example: "DEMO-1K9L2M3N-A1B2C3D4"
```

**Step 5: Create Payment Record**
```javascript
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
  isDemoTransaction: true
});
```

**Step 6: Update Booking**
```javascript
booking.paymentStatus = "COMPLETED";
booking.paymentMethod = paymentMethod;
booking.paidAt = new Date();
booking.transactionId = transactionId;
await booking.save();
```

**Step 7: Mark Vehicle as Inactive**
```javascript
await Vehicle.findByIdAndUpdate(vehicleId, { status: 'inactive' });
```

#### Success Response:

```json
{
  "success": true,
  "message": "Payment successful",
  "transactionId": "DEMO-1K9L2M3N-A1B2C3D4",
  "paymentId": "60d5ec49f1b2c8b1f8e4e1a5",
  "amount": 10000,
  "paymentMethod": "Demo Wallet",
  "completedAt": "2026-01-30T12:45:00.000Z",
  "newBalance": 15000,
  "booking": {
    "id": "60d5ec49f1b2c8b1f8e4e1a2",
    "status": "CONFIRMED",
    "paymentStatus": "COMPLETED",
    "vehicle": {
      "name": "Toyota Corolla",
      "model": "Corolla"
    }
  }
}
```

#### Payment Failure:

If payment fails (can be simulated with 10% probability):

```json
{
  "success": false,
  "message": "Payment failed. Please try again.",
  "transactionId": "DEMO-1K9L2M3N-FAILED",
  "failureReason": "Demo: Random failure simulation"
}
```

**What Happens on Failure**:
1. Payment record created with status "FAILED"
2. Booking payment status remains "PENDING"
3. User can retry payment
4. No wallet transfer occurs
5. Vehicle remains active

---

## Money Flow and Calculations

### Fare Breakdown Structure

Every payment is broken down into three components:

| Component | Percentage | Description |
|-----------|-----------|-------------|
| **Base Fare** | 70% | Core rental cost (goes to owner) |
| **Distance Fare** | 20% | Location-based charges (goes to owner) |
| **Service Fee** | 10% | Platform commission (theoretical) |

### Example Calculation:

For a booking with **Total Price: NPR 10,000**

```
Base Fare     = 10000 × 0.70 = NPR 7,000
Distance Fare = 10000 × 0.20 = NPR 2,000
Service Fee   = 10000 × 0.10 = NPR 1,000
────────────────────────────────────────
Total Amount                 = NPR 10,000
```

### Wallet Balance Flow:

#### Before Payment:
```
User Wallet:  NPR 20,000
Owner Wallet: NPR 5,000
```

#### After Payment (NPR 10,000):
```
User Wallet:  NPR 10,000  (decreased by 10,000)
Owner Wallet: NPR 15,000  (increased by 10,000)
```

**Note**: Currently, the entire amount goes to the owner. The service fee breakdown is for transparency and future implementation.

### Transaction History View:

#### For User (Renter):
```json
{
  "transactionId": "DEMO-1K9L2M3N-A1B2C3D4",
  "amount": 10000,
  "type": "DEBIT",
  "description": "Payment to Jane Smith for Toyota Corolla",
  "amountBreakdown": {
    "baseFare": 7000,
    "distanceFare": 2000,
    "serviceFee": 1000,
    "total": 10000
  }
}
```

#### For Owner:
```json
{
  "transactionId": "DEMO-1K9L2M3N-A1B2C3D4",
  "amount": 10000,
  "type": "CREDIT",
  "description": "Payment from John Doe for Toyota Corolla",
  "amountBreakdown": {
    "baseFare": 7000,
    "distanceFare": 2000,
    "serviceFee": 1000,
    "total": 10000
  }
}
```

---

## Refund System

**Endpoint**: `POST /api/payment/refund/:paymentId`  
**Access**: Private (Payment User Only)

### Refund Process:

```
User Cancels Paid Booking → Initiates Refund → 
Payment Status = REFUNDED → Booking Payment Status = REFUNDED
```

#### Request:
```
POST /api/payment/refund/60d5ec49f1b2c8b1f8e4e1a5
```

#### Validation:
- User must own the payment (be the payer)
- Payment status must be "COMPLETED"
- Cannot refund already refunded payments

#### Response:
```json
{
  "success": true,
  "message": "Payment refunded successfully",
  "transactionId": "DEMO-1K9L2M3N-A1B2C3D4",
  "refundAmount": 10000
}
```

**Note**: In the current demo implementation, refunds update the status but do not reverse wallet transactions. This can be enhanced to include automatic wallet reversals.

---

## API Endpoints

### Booking Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/booking/` | Create new booking request | Verified User |
| GET | `/api/booking/user` | Get user's bookings (as renter) | User |
| GET | `/api/booking/owner` | Get owner's booking requests | Owner |
| GET | `/api/booking/:bookingId` | Get single booking details | User/Owner |
| PATCH | `/api/booking/:bookingId/status` | Accept/Reject booking | Owner |
| PATCH | `/api/booking/:bookingId/cancel` | Cancel booking | User |

### Payment Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/payment/demo` | Process demo payment | User |
| GET | `/api/payment/booking/:bookingId` | Get payment for booking | User/Owner |
| GET | `/api/payment/user/history` | Get transaction history | User |
| POST | `/api/payment/refund/:paymentId` | Refund a payment | User |
| DELETE | `/api/payment/user/clear-history` | Clear transaction history | User |

---

## Data Models

### Booking Schema Fields:

```javascript
{
  user: ObjectId,              // Renter
  vehicle: ObjectId,            // Vehicle being rented
  owner: ObjectId,              // Vehicle owner
  pickupDate: Date,
  dropoffDate: Date,
  totalDays: Number,
  pricePerDay: Number,
  totalPrice: Number,
  status: String,               // PENDING, CONFIRMED, REJECTED, EXPIRED, CANCELLED, COMPLETED
  bookingTime: Date,
  expiresAt: Date,             // 5 minutes from creation
  message: String,
  rejectionReason: String,
  paymentStatus: String,        // PENDING, COMPLETED, FAILED, REFUNDED
  paymentMethod: String,        // 'Demo Wallet', 'Cash'
  paidAt: Date,
  transactionId: String
}
```

### Payment Schema Fields:

```javascript
{
  booking: ObjectId,
  user: ObjectId,               // Payer
  owner: ObjectId,              // Receiver
  vehicle: ObjectId,
  bookingDetails: {             // Snapshot for deleted bookings
    pickupDate: Date,
    dropoffDate: Date,
    totalDays: Number,
    pickupLocation: String,
    vehicleName: String,
    vehicleModel: String
  },
  amount: {
    baseFare: Number,           // 70%
    distanceFare: Number,       // 20%
    serviceFee: Number,         // 10%
    totalAmount: Number         // 100%
  },
  paymentMethod: String,        // 'Demo Wallet', 'Cash'
  status: String,               // PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED
  transactionId: String,        // Unique ID
  initiatedAt: Date,
  completedAt: Date,
  failureReason: String,
  isDemoTransaction: Boolean,
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceType: String
  }
}
```

---

## Security and Authorization

### Access Control:

1. **All endpoints require authentication** (JWT token via `authMiddleware`)
2. **Role-based access**:
   - Users can only view/cancel their own bookings
   - Owners can only accept/reject their vehicle bookings
   - Payment can only be made by booking creator

3. **Verification requirements**:
   - Creating bookings requires verified user status
   - Checked via `verifyUser` middleware

### Validation Layers:

1. **Input validation** (required fields, data types)
2. **Business logic validation** (booking conflicts, sufficient balance)
3. **Authorization checks** (ownership, permissions)
4. **State validation** (booking status, payment status)

---

## Best Practices & Notes

### For Developers:

1. **Always check booking expiration** before displaying to users
2. **Populate related documents** for complete information
3. **Use transactions** for wallet transfers (future enhancement)
4. **Store booking snapshots** in payments for audit trail
5. **Validate status transitions** to prevent invalid states

### For Users:

1. **Respond to booking requests within 5 minutes**
2. **Check wallet balance before booking**
3. **Review booking details before payment**
4. **Transaction history is preserved** even if bookings are deleted

### System Features:

1. **Automatic expiration** prevents indefinite pending states
2. **Vehicle status management** prevents double bookings
3. **Complete audit trail** via payment records
4. **Booking snapshots** preserve data integrity
5. **Transaction transparency** with detailed breakdowns

---

## Future Enhancements

1. **Real payment gateway integration** (Stripe, Khalti, eSewa)
2. **Automatic refund processing** with wallet reversal
3. **Cancellation policies** with refund percentages
4. **Booking extensions** and modifications
5. **Review system** post-completion
6. **Dispute resolution** mechanism
7. **Dynamic pricing** based on demand
8. **Insurance options** integration

---

**Last Updated**: January 30, 2026  
**Version**: 1.0  
**System**: RideShareX Booking & Payment Module
