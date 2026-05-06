# 🛠️ RideShareX Tech Stack - Complete Guide

## 📚 Table of Contents
1. [Tech Stack Overview](#tech-stack-overview)
2. [Backend Technologies](#backend-technologies)
3. [Frontend Technologies](#frontend-technologies)
4. [Database & Storage](#database--storage)
5. [Development Tools](#development-tools)
6. [Why We Chose Each Technology](#why-we-chose-each-technology)

---

## 🎯 Tech Stack Overview

RideShareX is built using the **MERN Stack** with additional tools for authentication, styling, and file handling.

```
┌─────────────────────────────────────────────┐
│              FRONTEND (Client)              │
│  React + React Router + Tailwind CSS        │
│  Axios + Google OAuth                       │
└──────────────┬──────────────────────────────┘
               │ HTTP Requests (API Calls)
               ↓
┌─────────────────────────────────────────────┐
│              BACKEND (Server)               │
│  Node.js + Express.js                       │
│  JWT Authentication + Multer                │
└──────────────┬──────────────────────────────┘
               │ Database Queries
               ↓
┌─────────────────────────────────────────────┐
│              DATABASE                       │
│  MongoDB (with Mongoose)                    │
└─────────────────────────────────────────────┘
```

---

## 🔧 Backend Technologies

### 1. **Node.js**
**Purpose:** JavaScript runtime for server-side code  
**Version:** v14+  
**What it does:**
- Allows us to write server code in JavaScript
- Handles multiple requests simultaneously (non-blocking)
- Provides npm (Node Package Manager) for installing libraries

**Why we use it:**
- Same language (JavaScript) for frontend and backend
- Huge ecosystem of packages
- Fast and efficient for I/O operations

**Example:**
```javascript
const http = require('http');
const server = http.createServer((req, res) => {
  res.end('Hello from Node.js!');
});
server.listen(5000);
```

---

### 2. **Express.js**
**Purpose:** Web framework for Node.js  
**Version:** 5.1.0  
**What it does:**
- Simplifies routing (handling different URLs)
- Middleware support (authentication, logging, etc.)
- Easy API creation

**Why we use it:**
- Simple and minimalist
- Industry standard
- Great documentation

**File:** `backend/server.js`
```javascript
const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Routes
app.get('/api/vehicles', (req, res) => {
  res.json({ vehicles: [] });
});

app.listen(5000, () => console.log('Server running'));
```

---

### 3. **Mongoose**
**Purpose:** MongoDB object modeling  
**Version:** 9.0.0  
**What it does:**
- Connects Node.js to MongoDB
- Defines database schemas (structure)
- Validates data before saving
- Provides query methods

**Why we use it:**
- Type safety and validation
- Easier than raw MongoDB queries
- Built-in methods for CRUD operations

**File:** `backend/models/User.js`
```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  phone: String
});

module.exports = mongoose.model('User', userSchema);
```

---

### 4. **JWT (jsonwebtoken)**
**Purpose:** User authentication  
**Version:** 9.0.2  
**What it does:**
- Creates secure tokens for logged-in users
- Verifies user identity on protected routes
- Stateless authentication (no sessions)

**Why we use it:**
- More secure than cookies
- Scalable (no server-side sessions)
- Works great with SPAs (React)

**File:** `backend/middleware/auth.js`
```javascript
const jwt = require('jsonwebtoken');

// Generate token on login
const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
  expiresIn: '7d'
});

// Verify token on protected routes
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

---

### 5. **bcryptjs**
**Purpose:** Password hashing  
**Version:** 3.0.3  
**What it does:**
- Encrypts passwords before storing
- Compares plain password with hashed password

**Why we use it:**
- Never store plain text passwords
- Adds salt to prevent rainbow table attacks
- Industry standard

**Example:**
```javascript
const bcrypt = require('bcryptjs');

// Hash password
const hashedPassword = await bcrypt.hash('myPassword123', 10);

// Compare password
const isMatch = await bcrypt.compare('myPassword123', hashedPassword);
```

---

### 6. **Multer**
**Purpose:** File upload handling  
**Version:** 2.0.2  
**What it does:**
- Handles multipart/form-data (file uploads)
- Saves uploaded files to server or memory
- File validation (type, size)

**Why we use it:**
- Easy file upload handling
- Built for Express.js
- Configurable storage options

**File:** `backend/config/multer.js`
```javascript
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  }
});
```

---

### 7. **CORS**
**Purpose:** Cross-Origin Resource Sharing  
**Version:** 2.8.5  
**What it does:**
- Allows frontend (localhost:3000) to call backend (localhost:5000)
- Prevents unauthorized domains from accessing API

**Why we use it:**
- Frontend and backend run on different ports
- Security against unauthorized access

**File:** `backend/server.js`
```javascript
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

---

### 8. **dotenv**
**Purpose:** Environment variable management  
**Version:** 17.2.3  
**What it does:**
- Loads environment variables from `.env` file
- Keeps sensitive data out of code

**Why we use it:**
- Never hardcode API keys or secrets
- Different configs for dev/production

**File:** `.env`
```
MONGODB_URI=mongodb://localhost:27017/ridesharex
JWT_SECRET=mysecretkey123
PORT=5000
```

**Usage:**
```javascript
require('dotenv').config();
console.log(process.env.MONGODB_URI);
```

---

## 🎨 Frontend Technologies

### 1. **React**
**Purpose:** UI library for building user interfaces  
**Version:** 19.2.0  
**What it does:**
- Component-based architecture
- Virtual DOM for fast rendering
- State management with hooks

**Why we use it:**
- Reusable components
- Large ecosystem
- Easy to learn

**File:** `frontend/src/App.jsx`
```javascript
import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  );
}
```

---

### 2. **React Router DOM**
**Purpose:** Client-side routing  
**Version:** 7.9.6  
**What it does:**
- Navigation between pages without page reload
- Protected routes (authentication required)
- URL parameters

**Why we use it:**
- Single Page Application (SPA)
- Better user experience
- Easy route management

**File:** `frontend/src/App.jsx`
```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<BrowserRouter>
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/vehicles" element={<VehiclesPage />} />
    <Route path="/book/:id" element={<BookNowPage />} />
  </Routes>
</BrowserRouter>
```

---

### 3. **Axios**
**Purpose:** HTTP client for API requests  
**Version:** 1.13.2  
**What it does:**
- Makes HTTP requests (GET, POST, PUT, DELETE)
- Handles request/response interceptors
- Automatic JSON transformation

**Why we use it:**
- Better than fetch API
- Automatic error handling
- Request cancellation support

**File:** `frontend/src/services/apiService.js`
```javascript
import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:5000';

export const getVehicles = async () => {
  const response = await axios.get('/api/vehicles/all');
  return response.data.vehicles;
};

export const createBooking = async (data) => {
  const response = await axios.post('/api/bookings/create', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
```

---

### 4. **Google OAuth (@react-oauth/google)**
**Purpose:** Google authentication  
**Version:** 0.12.2  
**What it does:**
- Google login button
- Handles OAuth flow
- Returns user info from Google

**Why we use it:**
- Secure authentication
- Users don't need to create password
- Faster signup process

**File:** `frontend/src/components/auth/GoogleLoginButton.jsx`
```javascript
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

<GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
  <GoogleLogin
    onSuccess={(response) => {
      // Send token to backend
      handleGoogleLogin(response.credential);
    }}
    onError={() => console.error('Login failed')}
  />
</GoogleOAuthProvider>
```

---

### 5. **Tailwind CSS**
**Purpose:** Utility-first CSS framework  
**Version:** Latest  
**What it does:**
- Provides pre-built CSS classes
- Responsive design utilities
- Fast styling without writing CSS

**Why we use it:**
- Faster development
- Consistent design
- No CSS file bloat

**File:** `frontend/src/pages/LandingPage.jsx`
```javascript
<div className="bg-blue-500 text-white p-4 rounded-lg shadow-md hover:bg-blue-600">
  <h1 className="text-2xl font-bold">Welcome to RideShareX</h1>
  <p className="text-sm mt-2">Find your perfect ride</p>
</div>
```

**Configuration:** `frontend/tailwind.config.js`
```javascript
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981'
      }
    }
  }
};
```

---

### 6. **jwt-decode**
**Purpose:** Decode JWT tokens  
**Version:** 4.0.0  
**What it does:**
- Decodes JWT token without verification
- Extracts user info from token

**Why we use it:**
- Get user ID from token
- Check token expiration
- Client-side token inspection

**Example:**
```javascript
import { jwtDecode } from 'jwt-decode';

const token = localStorage.getItem('token');
const decoded = jwtDecode(token);
console.log(decoded.userId); // "abc123"
console.log(decoded.exp); // Expiration timestamp
```

---

### 7. **Lucide React**
**Purpose:** Icon library  
**Version:** 0.553.0  
**What it does:**
- Provides beautiful SVG icons
- Tree-shakeable (only imports used icons)

**Why we use it:**
- Modern and clean icons
- Lightweight
- Easy to customize

**File:** `frontend/src/components/common/Navbar.jsx`
```javascript
import { Menu, User, LogOut, Car } from 'lucide-react';

<Menu className="w-6 h-6 text-white" />
<User className="w-5 h-5 mr-2" />
<Car className="w-8 h-8 text-blue-500" />
```

---

## 💾 Database & Storage

### 1. **MongoDB**
**Purpose:** NoSQL database  
**What it does:**
- Stores data in JSON-like documents
- Flexible schema
- Horizontal scaling

**Why we use it:**
- Works great with JavaScript
- No need for complex SQL queries
- Easy to modify schema

**File:** `backend/config/db.js`
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB Connected');
};
```

**Example Document:**
```json
{
  "_id": "abc123",
  "name": "John Doe",
  "email": "john@example.com",
  "vehicles": ["vehicle1", "vehicle2"],
  "createdAt": "2026-01-31T10:00:00Z"
}
```

---

## 🛠️ Development Tools

### 1. **Nodemon**
**Purpose:** Auto-restart server on file changes  
**Version:** 3.1.11  
**Why we use it:**
- No need to manually restart server
- Faster development

**Usage:**
```bash
npm run dev  # Uses nodemon
```

---

### 2. **React Scripts**
**Purpose:** Build tools for React  
**Version:** 5.0.1  
**What it does:**
- Development server with hot reload
- Production build optimization
- Testing setup

**Commands:**
```bash
npm start   # Start dev server
npm run build   # Create production build
npm test    # Run tests
```

---

### 3. **PostCSS**
**Purpose:** CSS processing  
**What it does:**
- Processes Tailwind CSS
- Auto-prefixes CSS

**File:** `frontend/postcss.config.js`
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

---

## 🎯 Why We Chose Each Technology

| Technology | Reason | Alternative |
|-----------|--------|-------------|
| **React** | Component reusability, large community | Vue.js, Angular |
| **Node.js + Express** | JavaScript everywhere, simple API creation | Django (Python), Flask |
| **MongoDB** | Flexible schema, JSON-like documents | PostgreSQL, MySQL |
| **Tailwind CSS** | Fast styling, no CSS file management | Bootstrap, Material-UI |
| **JWT** | Stateless auth, scalable | Session-based auth |
| **Axios** | Better error handling than fetch | Fetch API |
| **Google OAuth** | Secure, no password management | Email/password auth |
| **Mongoose** | Schema validation, easier queries | Native MongoDB driver |

---

## 📊 Technology Comparison

### Frontend Framework
```
React ✅
- Component-based
- Virtual DOM
- Large ecosystem

Vue.js
- Easier learning curve
- Smaller bundle size

Angular
- Full-featured framework
- TypeScript by default
- Steeper learning curve
```

### Backend Framework
```
Express.js ✅
- Minimal and flexible
- Large middleware ecosystem
- Easy to learn

Nest.js
- TypeScript support
- Built-in architecture
- More opinionated

Fastify
- Faster than Express
- Smaller ecosystem
```

### Database
```
MongoDB ✅
- Flexible schema
- Easy to scale horizontally
- JSON-like documents

PostgreSQL
- Relational database
- ACID compliance
- Complex queries

MySQL
- Mature and stable
- Good for structured data
```

---

## 🚀 Full Technology Stack Summary

```
FRONTEND
├── React (UI Library)
├── React Router (Navigation)
├── Axios (API Calls)
├── Tailwind CSS (Styling)
├── Google OAuth (Authentication)
├── Lucide React (Icons)
└── jwt-decode (Token Handling)

BACKEND
├── Node.js (Runtime)
├── Express.js (Web Framework)
├── Mongoose (Database ORM)
├── JWT (Authentication)
├── bcryptjs (Password Hashing)
├── Multer (File Uploads)
├── CORS (Cross-Origin)
└── dotenv (Environment Variables)

DATABASE
└── MongoDB (NoSQL Database)

TOOLS
├── Nodemon (Auto-restart)
├── React Scripts (Build Tools)
└── PostCSS (CSS Processing)
```

---

## 📝 Summary

- **Backend:** Node.js + Express handles API requests
- **Frontend:** React creates interactive UI
- **Database:** MongoDB stores all data
- **Authentication:** JWT + Google OAuth for security
- **Styling:** Tailwind CSS for fast, beautiful designs
- **File Upload:** Multer handles vehicle photos
- **API Calls:** Axios communicates between frontend and backend

Each technology serves a specific purpose and works together to create a complete, scalable application! 🎉
