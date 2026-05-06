# Google Authentication System - RideShareX

## 📋 Overview

RideShareX uses **Google OAuth 2.0** for user authentication, providing a secure and seamless login experience. This document explains the complete authentication flow, implementation details, and how different components work together.

---

## 🏗️ System Architecture

### Authentication Flow Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐         ┌──────────────┐
│   User      │────────▶│   Google     │────────▶│  Frontend   │────────▶│   Backend    │
│   Browser   │         │   OAuth      │         │  Component  │         │   Server     │
└─────────────┘         └──────────────┘         └─────────────┘         └──────────────┘
      │                        │                         │                        │
      │ 1. Click Login         │                         │                        │
      │─────────────────────▶  │                         │                        │
      │                        │                         │                        │
      │ 2. Google Login UI     │                         │                        │
      │◀─────────────────────  │                         │                        │
      │                        │                         │                        │
      │ 3. Enter Credentials   │                         │                        │
      │─────────────────────▶  │                         │                        │
      │                        │                         │                        │
      │ 4. JWT Token           │                         │                        │
      │◀─────────────────────  │                         │                        │
      │                        │                         │                        │
      │ 5. Send Token to Frontend                        │                        │
      │──────────────────────────────────────────────▶   │                        │
      │                                                   │                        │
      │                                    6. Decode JWT & Send User Data         │
      │                                                   │───────────────────────▶│
      │                                                   │                        │
      │                                    7. Create/Login User & Generate JWT    │
      │                                                   │◀───────────────────────│
      │                                                   │                        │
      │ 8. Store Token & User Data                       │                        │
      │◀──────────────────────────────────────────────── │                        │
```

---

## 🔧 Technology Stack

### Frontend
- **@react-oauth/google** `^0.12.2` - Google OAuth integration
- **jwt-decode** `^4.0.0` - JWT token decoding
- **axios** `^1.13.2` - HTTP client
- **React Context API** - State management

### Backend
- **jsonwebtoken** `^9.0.2` - JWT generation & verification
- **Express.js** `^5.1.0` - Server framework
- **Mongoose** `^9.0.0` - MongoDB ORM

---

## 📝 Implementation Details

### 1. Frontend Components

#### **GoogleLoginButton Component**
Location: `frontend/src/components/auth/GoogleLoginButton.jsx`

**Purpose:** Renders the Google Sign-In button and handles the OAuth flow.

```jsx
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
```

**Key Features:**
- Uses Google's OAuth library to display the login button
- Decodes the JWT credential received from Google
- Extracts user information (googleId, email, name, picture)
- Sends user data to the backend API
- Handles success and error scenarios

**Flow:**
1. User clicks the Google Sign-In button
2. Google OAuth popup appears
3. User authenticates with Google
4. Google returns a JWT token
5. Token is decoded to extract user information
6. User data is sent to backend endpoint `/api/auth/google-login`
7. Backend response is passed to parent component via callback

#### **AuthContext Provider**
Location: `frontend/src/context/AuthContext.jsx`

**Purpose:** Manages global authentication state across the application.

**Key Features:**
- Stores user data and JWT token
- Configures axios with authentication headers
- Persists authentication in localStorage
- Provides auth methods: `login()`, `logout()`, `updateUser()`, `refreshUser()`
- Automatically loads user on app mount

**State Management:**
```javascript
const [user, setUser] = useState(null);
const [token, setToken] = useState(localStorage.getItem('token'));
```

---

### 2. Backend Implementation

#### **Authentication Routes**
Location: `backend/routes/auth.js`

##### **POST /api/auth/google-login**
**Purpose:** Handle Google OAuth login/registration

**Request Body:**
```json
{
  "googleId": "string",
  "email": "string",
  "name": "string",
  "picture": "string (URL)"
}
```

**Response (Existing User):**
```json
{
  "message": "Login successful",
  "isNewUser": false,
  "token": "JWT_TOKEN",
  "user": {
    "id": "user_id",
    "googleId": "google_id",
    "email": "user@example.com",
    "name": "User Name",
    "picture": "profile_picture_url",
    "phone": "phone_number",
    "city": "city_name",
    "role": "user|admin",
    "isProfileComplete": true,
    "isVerified": true,
    "verificationStatus": "APPROVED",
    "citizenshipPhoto": "photo_url",
    "hasListedVehicles": true
  }
}
```

**Response (New User):**
```json
{
  "message": "Account created successfully",
  "isNewUser": true,
  "token": "JWT_TOKEN",
  "user": {
    "id": "user_id",
    "googleId": "google_id",
    "email": "user@example.com",
    "name": "User Name",
    "picture": "profile_picture_url",
    "isProfileComplete": false,
    "role": "user",
    "hasListedVehicles": false,
    "walletBalance": 10000,
    "isVerified": false,
    "verificationStatus": "NOT_SUBMITTED"
  }
}
```

**Logic:**
1. Validate required fields (googleId, email, name, picture)
2. Check if user exists in database by `googleId`
3. **If existing user:**
   - Update `lastLogin` timestamp
   - Generate JWT token
   - Return user data and token
4. **If new user:**
   - Create new User document
   - Set default values (isProfileComplete: false, role: 'user')
   - Generate JWT token
   - Return user data with `isNewUser: true` flag

##### **POST /api/auth/complete-profile**
**Purpose:** Complete user profile for new users (requires authentication)

**Headers:**
```
Authorization: Bearer JWT_TOKEN
```

**Request Body:**
```json
{
  "phone": "string",
  "city": "string"
}
```

**Response:**
```json
{
  "message": "Profile completed successfully",
  "user": { /* updated user object */ }
}
```

#### **Authentication Middleware**
Location: `backend/middleware/auth.js`

**Purpose:** Verify JWT tokens for protected routes

**How it works:**
1. Extracts token from `Authorization` header
2. Removes "Bearer " prefix
3. Verifies token using `JWT_SECRET`
4. Decodes userId and attaches to `req.userId`
5. Allows request to proceed to route handler

**Usage:**
```javascript
router.post('/protected-route', authMiddleware, async (req, res) => {
  const userId = req.userId; // Available after middleware
  // ... route logic
});
```

---

### 3. Database Model

#### **User Schema**
Location: `backend/models/User.js`

**Google OAuth Fields:**
```javascript
{
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  picture: { type: String, required: true }
}
```

**Additional Profile Fields:**
```javascript
{
  phone: String,
  address: String,
  city: String,
  isProfileComplete: Boolean
}
```

**Verification Fields:**
```javascript
{
  citizenshipPhoto: String,
  isVerified: Boolean,
  verificationStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'NOT_SUBMITTED']
  }
}
```

**System Fields:**
```javascript
{
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  hasListedVehicles: Boolean,
  walletBalance: { type: Number, default: 100000 },
  createdAt: Date,
  lastLogin: Date
}
```

---

## 🔐 Security Features

### 1. **JWT Token Security**
- Tokens expire after 7 days
- Signed with secret key (`JWT_SECRET` from environment)
- Stored securely in localStorage
- Attached to all authenticated requests

### 2. **Token Generation**
```javascript
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};
```

### 3. **Protected Routes**
All sensitive endpoints require the `authMiddleware`:
- `/api/auth/complete-profile`
- `/api/auth/me`
- `/api/vehicles/*` (most endpoints)
- `/api/bookings/*`
- `/api/payments/*`

### 4. **Google OAuth Security**
- Google handles password security
- No password storage in database
- Unique `googleId` prevents duplicate accounts
- Email verification by Google

---

## 🚀 Setup Instructions

### 1. **Google Cloud Console Setup**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen
6. Add authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - Your production domain
7. Add authorized redirect URIs
8. Copy the **Client ID**

### 2. **Environment Variables**

**Frontend (.env):**
```env
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
REACT_APP_API_URL=http://localhost:5000
```

**Backend (.env):**
```env
JWT_SECRET=your_super_secure_random_string_here
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

### 3. **Frontend Configuration**

**Wrap app with GoogleOAuthProvider** (in `index.js` or `App.js`):
```jsx
import { GoogleOAuthProvider } from '@react-oauth/google';

<GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
  <AuthProvider>
    <App />
  </AuthProvider>
</GoogleOAuthProvider>
```

---

## 🔄 Complete Authentication Flow

### **Step-by-Step Process:**

#### **1. User Initiates Login**
- User clicks Google Sign-In button on login page
- `GoogleLoginButton` component renders Google OAuth popup

#### **2. Google Authentication**
- User enters Google credentials
- Google validates credentials
- Google returns JWT token with user info

#### **3. Frontend Processing**
- `jwt-decode` extracts user data from Google token
- Data includes: `sub` (googleId), `email`, `name`, `picture`
- Frontend sends POST request to `/api/auth/google-login`

#### **4. Backend Processing**
- Server receives user data
- Queries database for existing user by `googleId`
- **If user exists:**
  - Updates `lastLogin`
  - Generates new JWT token
  - Returns user data + token
- **If new user:**
  - Creates new User document
  - Sets default values
  - Generates JWT token
  - Returns user data + token + `isNewUser: true`

#### **5. Token Storage**
- Frontend receives response
- JWT token stored in localStorage
- User data stored in AuthContext
- Axios configured with Authorization header

#### **6. Profile Completion (New Users)**
- If `isNewUser: true`, redirect to profile completion page
- User enters phone and city
- POST to `/api/auth/complete-profile` with JWT token
- Profile marked as complete

#### **7. Authenticated Requests**
- All subsequent API calls include:
  ```
  Authorization: Bearer <JWT_TOKEN>
  ```
- Backend middleware verifies token
- User ID extracted and available in routes

---

## 🧪 Testing the Authentication

### **Manual Testing Steps:**

1. **Test New User Registration:**
   ```
   1. Clear localStorage
   2. Click Google Sign-In
   3. Use a new Google account
   4. Verify redirect to profile completion
   5. Complete profile
   6. Check database for new user
   ```

2. **Test Existing User Login:**
   ```
   1. Logout from app
   2. Click Google Sign-In
   3. Use previously registered account
   4. Verify redirect to dashboard
   5. Check lastLogin timestamp updated
   ```

3. **Test Token Persistence:**
   ```
   1. Login with Google
   2. Refresh the page
   3. Verify user still logged in
   4. Check token in localStorage
   ```

4. **Test Protected Routes:**
   ```
   1. Try accessing /api/auth/me without token
   2. Verify 401 Unauthorized response
   3. Add valid token
   4. Verify successful response
   ```

---

## 🐛 Common Issues & Troubleshooting

### **Issue 1: "Login Failed" Error**
**Cause:** Invalid Google Client ID or misconfiguration
**Solution:**
- Verify `REACT_APP_GOOGLE_CLIENT_ID` in `.env`
- Check authorized origins in Google Console
- Ensure no trailing slashes in URLs

### **Issue 2: "Invalid Token" Error**
**Cause:** JWT_SECRET mismatch or expired token
**Solution:**
- Verify `JWT_SECRET` is consistent
- Check token expiration (default 7 days)
- Clear localStorage and login again

### **Issue 3: User Not Created in Database**
**Cause:** MongoDB connection issues or validation errors
**Solution:**
- Check MongoDB connection string
- Verify all required fields are sent
- Check server logs for error details

### **Issue 4: CORS Errors**
**Cause:** Backend not allowing frontend origin
**Solution:**
```javascript
// In backend server.js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

---

## 📊 Authentication State Management

### **AuthContext Methods:**

```javascript
// Login (called after successful Google auth)
login(userData, authToken)

// Logout (clears all auth data)
logout()

// Update user data locally
updateUser({ name: 'New Name', city: 'New City' })

// Refresh user data from server
await refreshUser()

// Check authentication status
const { user, token, loading } = useAuth();
```

### **Usage in Components:**

```jsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, logout } = useAuth();
  
  if (!user) {
    return <div>Please login</div>;
  }
  
  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## 🔒 Best Practices

1. **Never expose JWT_SECRET** - Keep it in environment variables
2. **Use HTTPS in production** - Prevents token interception
3. **Implement token refresh** - For long-lived sessions
4. **Validate on backend** - Never trust frontend data
5. **Rate limit login attempts** - Prevent brute force attacks
6. **Log authentication events** - For security auditing
7. **Handle token expiration gracefully** - Auto-logout on expired tokens

---

## 📚 Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [@react-oauth/google Documentation](https://www.npmjs.com/package/@react-oauth/google)
- [JWT.io - Token Debugger](https://jwt.io/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs for error details
3. Verify environment variables are set correctly
4. Test with browser developer console open

---

**Last Updated:** January 26, 2026
**Version:** 1.0.0
