# 📚 RideShareX Project Structure & File Guide

## 🎯 Project Overview
**RideShareX** is a ride-sharing platform built with **Node.js + Express** (backend) and **React** (frontend). Users can become hosts, list vehicles, and book rides. It uses **MongoDB** for data storage and **JWT** for authentication.

---

## **BACKEND** (`/backend`)

### **Core Entry Point**
- **`server.js`** - Main server file that starts the Express app, connects to MongoDB, sets up middleware (CORS, JSON parsing), and defines all API routes

### **Configuration** (`/config`)
- **`db.js`** - Connects to MongoDB database using Mongoose
- **`multer.js`** - Handles file uploads (vehicle photos, profile pictures)

### **Database Models** (`/models`)
These define the structure of data stored in MongoDB:
- **`User.js`** - User data: email, name, phone, address, verification status
- **`Vehicle.js`** - Vehicle data: model, license plate, owner, availability
- **`Booking.js`** - Booking data: pickup/dropoff dates, renter, vehicle, total price
- **`Payment.js`** - Payment records: amount, status, transaction ID

### **Routes/API Endpoints** (`/routes`)
These define the HTTP endpoints clients can call:
- **`auth.js`** - User login, registration, profile update
- **`vehicle.js`** - Create, read, update, delete vehicles (CRUD)
- **`booking.js`** - Create bookings, view bookings, confirm/reject rides
- **`payment.js`** - Process payments, get transaction history
- **`recommendation.js`** - Get vehicle recommendations for users

### **Controllers** (`/controllers`)
These contain the business logic for each route:
- **`vehicleController.js`** - Logic for adding/editing/deleting vehicles
- **`bookingController.js`** - Logic for booking management
- **`paymentController.js`** - Logic for payment processing
- **`recommendationController.js`** - Logic for suggesting vehicles

### **Middleware** (`/middleware`)
These are functions that process requests before they reach controllers:
- **`auth.js`** - Verifies JWT token on protected routes
- **`verifyUser.js`** - Checks if user is verified/admin

### **Services** (`/services`)
Reusable utility functions:
- **`recommendationService.js`** - Algorithm to recommend vehicles based on user preferences

### **Utilities** (`/scripts`)
- **`migrateUserVerification.js`** - Database migration script to add new fields

---

## **FRONTEND** (`/frontend`)

### **Main Entry Point**
- **`src/index.js`** - Entry point that renders the React app to the DOM
- **`src/App.jsx`** - Main React component with routing setup, protected routes, and navigation

### **Authentication** (`/pages/auth`)
- **`LoginPage.jsx`** - Google login page
- **`RegisterDetailsPage.jsx`** - Complete profile after first login

### **Core Pages**
- **`LandingPage.jsx`** - Home page with search and featured vehicles
- **`DashBoardPage.jsx`** - User dashboard showing overview
- **`VehiclesPage.jsx`** - Browse all available vehicles
- **`TransactionHistoryPage.jsx`** - View payment history
- **`AdminVerificationPage.jsx`** - Admin panel to verify hosts

### **Vehicle Management** (`/pages/vehicles`)
- **`BecomeHostPage.jsx`** - User applies to become a host
- **`AddVehiclePage.jsx`** - Host adds a new vehicle with photos
- **`ManageVehiclesPage.jsx`** - Host view/edit/delete their vehicles
- **`BookNowPage.jsx`** - Renter books a specific vehicle

### **Booking Management** (`/pages/bookings`)
- **`MyBookingsPage.jsx`** - View your completed/ongoing bookings
- **`RentalRequestsPage.jsx`** - Host view booking requests from renters

### **Components** (`/components`)
Reusable UI elements:
- **`Navbar.jsx`** - Navigation bar at top
- **`SearchBar.jsx`** - Search functionality
- **`Modal.jsx`** - Popup dialog component
- **`PaymentModal.jsx`** - Payment form popup
- **`GoogleLoginButton.jsx`** - Google login button
- **`AuthLayout.jsx`** - Layout wrapper for auth pages
- **`PrivacyPolicy.jsx`** - Privacy policy text
- **`TermsOfService.jsx`** - Terms of service text

### **State Management** (`/context`)
- **`AuthContext.jsx`** - Global state for user login, token, and user data (shared across entire app)

### **API Communication** (`/services`)
- **`apiService.js`** - Axios configuration to call backend API endpoints

### **Utilities** (`/utils`)
- **`cleanupStorage.js`** - Clears old localStorage data on app load

### **Styling**
- **`index.css`** - Global styles
- **`animations.css`** - Custom animation effects
- **`tailwind.config.js`** - Tailwind CSS configuration
- **`postcss.config.js`** - PostCSS configuration for Tailwind

---

## **🔄 How Backend & Frontend Work Together**

```
Frontend (React)
    ↓ (sends HTTP request)
Backend API (Express)
    ↓ (queries database)
MongoDB (stores data)
    ↓ (returns data)
Backend API
    ↓ (sends JSON response)
Frontend (React) - displays to user
```

### **Example Flow - Booking a Vehicle:**
1. User clicks "Book Now" button in frontend (`BookNowPage.jsx`)
2. Frontend sends POST request to `/api/bookings/create` using `apiService.js`
3. Backend route (`routes/booking.js`) receives the request
4. Controller (`bookingController.js`) validates and processes the booking
5. Booking is saved to MongoDB using the `Booking` model
6. Backend returns confirmation JSON response
7. Frontend displays success message to user

---

## **📦 Key Dependencies**

### Backend
| Technology | Purpose |
|-----------|---------|
| **Express** | Backend web framework |
| **Mongoose** | MongoDB object modeling |
| **JWT (jsonwebtoken)** | Secure user authentication tokens |
| **bcryptjs** | Password hashing |
| **Multer** | File upload handling |
| **CORS** | Cross-origin resource sharing |
| **dotenv** | Environment variable management |

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React** | Frontend UI library |
| **React Router** | Navigation between pages |
| **Axios** | HTTP requests from frontend to backend |
| **Google OAuth** | Google login integration |
| **jwt-decode** | Decode JWT tokens |
| **Lucide React** | Icon library |
| **Tailwind CSS** | Utility-first CSS framework |

---

## **🚀 Quick Start**

### Prerequisites
- Node.js (v14+)
- MongoDB (local or MongoDB Atlas)
- Google OAuth credentials

### Backend Setup
```bash
cd backend
npm install
# Create .env file with:
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_secret_key
# FRONTEND_URL=http://localhost:3000
# PORT=5000
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
# Create .env file with:
# REACT_APP_API_URL=http://localhost:5000/api
# REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
npm start
```

---

## **📁 Project Structure**

```
RideShareX/
├── backend/
│   ├── server.js              # Entry point
│   ├── config/                # Configuration files
│   ├── controllers/           # Business logic
│   ├── middleware/            # Request processors
│   ├── models/                # Database schemas
│   ├── routes/                # API endpoints
│   ├── services/              # Utility functions
│   └── scripts/               # Database migrations
│
├── frontend/
│   ├── public/                # Static files
│   └── src/
│       ├── App.jsx            # Main component
│       ├── components/        # Reusable components
│       ├── context/           # Global state
│       ├── pages/             # Page components
│       ├── services/          # API calls
│       ├── styles/            # CSS files
│       └── utils/             # Helper functions
│
└── documentation/             # Project documentation
```

---

## **🔑 Key Features**

1. **User Authentication** - Google OAuth login with JWT
2. **Host Verification** - Admin approval for vehicle hosts
3. **Vehicle Management** - CRUD operations for vehicles
4. **Booking System** - Create, accept, reject bookings
5. **Payment Processing** - Track payment transactions
6. **Recommendations** - Suggest vehicles based on user preferences
7. **Photo Uploads** - Vehicle images with Multer

---

## **📖 Additional Documentation**

- [Google Authentication Guide](GOOGLE_AUTHENTICATION.md)
- [Payment System Documentation](PAYMENT_SYSTEM_DOCS.md)
- [Vehicle Management System](VEHICLE_MANAGEMENT_SYSTEM.md)
- [Become Host Page Documentation](BECOME_HOST_PAGE_DOCUMENTATION.md)
- [Profile Page Documentation](PROFILE_PAGE_DOCUMENTATION.md)
- [Quick Start Guide](QUICK_START.md)

---

## **🛠️ Development Tips**

### Running in Development Mode
- **Backend**: `npm run dev` (uses nodemon for auto-restart)
- **Frontend**: `npm start` (hot-reload enabled)

### File Structure Best Practices
- Keep components small and reusable
- Use controllers to separate route logic
- Store sensitive data in `.env` files
- Never commit `.env` files to Git

### Common Commands
```bash
# Backend
npm run dev          # Start with nodemon
npm start            # Start server

# Frontend
npm start            # Start development server
npm run build        # Build for production
```

---

## **📝 License**
ISC

---

**Built with  for RideShareX**
