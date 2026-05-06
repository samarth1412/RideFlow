import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { cleanupLocalStorage, needsCleanup } from './utils/cleanupStorage';
import LoginPage from './pages/auth/LoginPage';
import RegisterDetailsPage from './pages/auth/RegisterDetailsPage';
import LandingPage from './pages/LandingPage';
import VehiclesPage from './pages/VehiclesPage';
import DashboardPage from './pages/DashBoardPage';
import AddVehiclePage from './pages/vehicles/AddVehiclePage';
import BookNowPage from './pages/vehicles/BookNowPage';
import BecomeHostPage from './pages/vehicles/BecomeHostPage';
import ManageVehiclesPage from './pages/vehicles/ManageVehiclesPage';
import MyBookingsPage from './pages/bookings/MyBookingsPage';
import RentalRequestsPage from './pages/bookings/RentalRequestsPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import AdminVerificationPage from './pages/AdminVerificationPage';
import './styles/animations.css';

// Cleanup localStorage on app load
if (needsCleanup()) {
  cleanupLocalStorage();
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  // Redirect to complete profile if not completed
  if (!user.isProfileComplete && window.location.pathname !== '/register-details') {
    return <Navigate to="/register-details" replace />;
  }
  
  return children;
}

// Public Route Component
function PublicRoute({ children }) {
  const { user } = useAuth();
  
  if (user && user.isProfileComplete) {
    return <Navigate to="/home" replace />;
  }
  
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      
      {/* Protected Routes */}
      <Route path="/register-details" element={
        <ProtectedRoute>
          <RegisterDetailsPage />
        </ProtectedRoute>
      } />
      
      <Route path="/home" element={
        <ProtectedRoute>
          <LandingPage />
        </ProtectedRoute>
      } />
      
      <Route path="/vehicles" element={
        <ProtectedRoute>
          <VehiclesPage />
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />

      <Route path="/add-vehicle" element={
        <ProtectedRoute>
          <AddVehiclePage />
        </ProtectedRoute>
      } />

      <Route path="/become-host" element={
        <ProtectedRoute>
          <BecomeHostPage />
        </ProtectedRoute>
      } />

      <Route path="/manage-vehicles" element={
        <ProtectedRoute>
          <ManageVehiclesPage />
        </ProtectedRoute>
      } />

      <Route path="/book-now" element={
        <ProtectedRoute>
          <BookNowPage />
        </ProtectedRoute>
      } />

      <Route path="/my-bookings" element={
        <ProtectedRoute>
          <MyBookingsPage />
        </ProtectedRoute>
      } />

      <Route path="/rental-requests" element={
        <ProtectedRoute>
          <RentalRequestsPage />
        </ProtectedRoute>
      } />

      <Route path="/transactions" element={
        <ProtectedRoute>
          <TransactionHistoryPage />
        </ProtectedRoute>
      } />

      <Route path="/admin/verifications" element={
        <ProtectedRoute>
          <AdminVerificationPage />
        </ProtectedRoute>
      } />

      {/* Catch all - redirect based on auth status */}
      <Route path="*" element={<Navigate to={user ? "/home" : "/"} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;