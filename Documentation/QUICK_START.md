# 🚀 Quick Start Guide - Demo Payment System

## Prerequisites Checklist
- [ ] Node.js installed (v14+)
- [ ] MongoDB installed and running
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

---

## 1️⃣ Initial Setup (First Time Only)

### Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your values:
# MONGODB_URI=mongodb://localhost:27017/ridesharex
# JWT_SECRET=your_secret_key_here
# FRONTEND_URL=http://localhost:3000
# PORT=5000

# Start MongoDB (if not already running)
# Windows: mongod --dbpath C:\data\db
# Mac/Linux: mongod
```

### Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with:
# REACT_APP_API_URL=http://localhost:5000
# REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## 2️⃣ Running the Application

### Terminal 1 - Backend Server
```bash
cd backend
npm start

# You should see:
# 🚀 Server running on port 5000
# ✅ MongoDB connected
```

### Terminal 2 - Frontend Server
```bash
cd frontend
npm start

# Browser opens automatically to http://localhost:3000
```

---

## 3️⃣ Testing Payment Flow

### Step-by-Step Test

**A. Create User Account**
1. Open http://localhost:3000
2. Click "Login" or "Get Started"
3. Login with Google
4. Complete profile (phone + city)

**B. Add a Vehicle (Become Host)**
1. Click "Become a Host"
2. Fill vehicle details:
   - Name: "Tesla Model X"
   - Model: "2024"
   - Make: "Tesla"
   - Price: 8999
   - Location: "Kathmandu"
   - Upload image
3. Submit listing

**C. Book Vehicle (Different Account)**
1. Logout
2. Login with different Google account
3. Complete profile
4. Browse vehicles
5. Click on Tesla Model X
6. Click "Book Now"
7. Select dates:
   - Pickup: Tomorrow
   - Dropoff: Day after tomorrow
8. Add optional message
9. Submit booking request

**D. Approve Booking (Owner Account)**
1. Logout
2. Login with owner account (first account)
3. Go to "Rental Requests"
4. See pending booking
5. Click "Approve"
6. Confirm approval

**E. Make Payment (Renter Account)**
1. Logout
2. Login with renter account (second account)
3. Go to "My Bookings"
4. See booking with green "Confirmed" badge
5. Click **"Proceed to Payment"** button
6. Payment modal opens
7. Review booking summary
8. Select payment method (Demo Wallet)
9. Click **"Pay NPR 8,999"**
10. Wait 2-3 seconds (processing animation)
11. See success screen 
12. View transaction ID
13. Auto-redirect to bookings

**F. Verify Payment**
1. Refresh page
2. See green payment badge
3. Check transaction ID displayed
4. Verify payment method shown
5. Confirm paid timestamp

---

## 4️⃣ Testing Payment Failure

Repeat steps A-E, then at step E.9:
- Click "Pay" multiple times until you get a failure (10% chance)
- When failed:
  - See red X icon
  - Click "Retry Payment"
  - Try again until successful

---

## 5️⃣ API Testing (Postman/cURL)

### Get User Bookings
```bash
curl -X GET http://localhost:5000/api/bookings/user \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Process Payment
```bash
curl -X POST http://localhost:5000/api/payment/demo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "bookingId": "BOOKING_ID_HERE",
    "paymentMethod": "Demo Wallet",
    "amount": 8999
  }'
```

### Get Payment History
```bash
curl -X GET http://localhost:5000/api/payment/user/history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 6️⃣ Common Issues & Solutions

### ❌ "User not found" error
**Cause:** JWT token issue or not logged in
**Fix:** 
- Clear browser cookies
- Logout and login again
- Check token in localStorage

### ❌ Backend not connecting to MongoDB
**Cause:** MongoDB not running
**Fix:**
```bash
# Start MongoDB
mongod --dbpath C:\data\db  # Windows
mongod                       # Mac/Linux
```

### ❌ "Booking must be confirmed before payment"
**Cause:** Owner hasn't approved yet
**Fix:** Login as owner and approve booking

### ❌ Payment button not showing
**Cause:** Wrong booking status
**Fix:** Ensure booking is:
- Status: CONFIRMED
- Payment Status: Not COMPLETED

### ❌ CORS errors
**Cause:** Frontend/backend URL mismatch
**Fix:** Check .env files match:
- Backend: `FRONTEND_URL=http://localhost:3000`
- Frontend: `REACT_APP_API_URL=http://localhost:5000`

### ❌ Payment modal not opening
**Cause:** PaymentModal component issue
**Fix:** Check browser console for errors

---

## 7️⃣ Database Verification

### Connect to MongoDB
```bash
mongosh
use ridesharex
```

### Check Bookings
```javascript
db.bookings.find().pretty()
// Look for your booking with paymentStatus: "COMPLETED"
```

### Check Payments
```javascript
db.payments.find().pretty()
// Verify payment record exists with correct transactionId
```

### Check Users
```javascript
db.users.find({}, { name: 1, email: 1 }).pretty()
```

---

## 8️⃣ Demo Presentation Checklist

Before showing to examiner:

### Pre-Demo Setup
- [ ] MongoDB running
- [ ] Backend server running (port 5000)
- [ ] Frontend server running (port 3000)
- [ ] Two browser profiles ready (or incognito)
- [ ] Test vehicle already listed
- [ ] Screenshots of successful payment ready

### During Demo
1. **Introduction** (1 min)
   - "This is a demo payment system"
   - "No real money involved"
   
2. **Show UI/UX** (2 min)
   - Professional design
   - Smooth animations
   - Clear information hierarchy

3. **Walk Through Flow** (3 min)
   - Browse → Book → Approve → Pay
   - Show success screen
   - Display payment record

4. **Show Code** (2 min)
   - Payment model structure
   - API endpoints
   - Transaction ID generation

5. **Demonstrate Error Handling** (1 min)
   - Show payment failure
   - Retry functionality

6. **Show Database** (1 min)
   - Payment records
   - Transaction IDs
   - Timestamps

### Questions to Prepare For
- "Why 10% failure rate?" 
  → To simulate real-world scenarios
  
- "How would you integrate real payment?"
  → Replace demo controller with eSewa/Khalti API calls
  
- "Is this production-ready?"
  → No, it's clearly marked as demo for academic purposes
  
- "Security concerns?"
  → JWT auth, input validation, but not PCI compliant (intentionally)

---

## 9️⃣ File Structure Reference

```
RideShareX/
├── backend/
│   ├── models/
│   │   ├── Payment.js          ← Payment schema
│   │   ├── Booking.js          ← Updated with payment fields
│   │   └── User.js
│   ├── controllers/
│   │   └── paymentController.js ← Payment logic
│   ├── routes/
│   │   ├── payment.js          ← Payment endpoints
│   │   └── booking.js
│   └── server.js               ← Updated with payment routes
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── PaymentModal.jsx ← Main payment UI
│   │   ├── pages/
│   │   │   └── bookings/
│   │   │       └── MyBookingsPage.jsx ← Updated with payment button
│   │   └── context/
│   │       └── AuthContext.jsx
│   └── .env.example
│
├── PAYMENT_SYSTEM_DOCS.md      ← Full documentation
├── PAYMENT_FLOW_DIAGRAM.md     ← Visual state flow
└── QUICK_START.md              ← This file
```

---

## 🔟 Pro Tips

### For Development
1. Keep browser DevTools open (F12)
2. Monitor Console for errors
3. Check Network tab for API calls
4. Use React DevTools for state inspection

### For Presentation
1. Practice the full flow 3 times
2. Have backup screenshots
3. Prepare 2-minute elevator pitch
4. Know your code inside-out
5. Be ready to show any file instantly

### For Debugging
1. Check backend terminal for logs
2. Look for console.log statements
3. Verify MongoDB connection
4. Test API with Postman first
5. Clear browser cache if weird issues

---

## 📞 Need Help?

### Debug Checklist
1. ✅ Is MongoDB running?
2. ✅ Is backend server running on port 5000?
3. ✅ Is frontend running on port 3000?
4. ✅ Are .env files configured?
5. ✅ Is user logged in?
6. ✅ Is booking in CONFIRMED status?
7. ✅ Is payment status NOT COMPLETED yet?
8. ✅ Check browser console for errors
9. ✅ Check backend terminal for errors
10. ✅ Try in incognito mode

---

## 🎉 Success Criteria

You'll know it's working when:
- ✅ Payment modal opens smoothly
- ✅ Processing animation shows (2-3s)
- ✅ Success screen appears with transaction ID
- ✅ Green payment badge shows in bookings
- ✅ Transaction ID is displayed
- ✅ Payment method is shown
- ✅ Timestamp is correct
- ✅ Database has payment record

---

**Last Updated:** January 15, 2026
**Version:** 1.0.0
**Status:** Ready for Demo 🚀
