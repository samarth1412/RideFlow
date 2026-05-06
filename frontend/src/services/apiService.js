/**
 * API Service - Centralized data fetching (NO localStorage except token)
 * All data comes from backend database
 */

import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper to create auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ===== PAYMENT & TRANSACTION APIs =====

/**
 * Get user's transaction history from database
 */
export const fetchTransactionHistory = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/payment/user/history`, {
      headers: getAuthHeaders()
    });
    return response.data.payments || [];
  } catch (error) {
    console.error('Fetch transaction history error:', error);
    throw error;
  }
};

/**
 * Process payment for a booking
 */
export const processPayment = async (bookingId, paymentMethod, amount) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/payment/demo`,
      { bookingId, paymentMethod, amount },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Process payment error:', error);
    throw error;
  }
};

/**
 * Clear user's transaction history
 */
export const clearTransactionHistory = async () => {
  try {
    const response = await axios.delete(`${BASE_URL}/api/payment/user/clear-history`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Clear transaction history error:', error);
    throw error;
  }
};

// ===== BOOKING APIs =====

/**
 * Get user's bookings
 */
export const fetchUserBookings = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/bookings/user`, {
      headers: getAuthHeaders()
    });
    return response.data.bookings || [];
  } catch (error) {
    console.error('Fetch user bookings error:', error);
    throw error;
  }
};

/**
 * Get rental requests (for vehicle owners)
 */
export const fetchRentalRequests = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/bookings/rental-requests`, {
      headers: getAuthHeaders()
    });
    return response.data.bookings || [];
  } catch (error) {
    console.error('Fetch rental requests error:', error);
    throw error;
  }
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (bookingId) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/bookings/${bookingId}/cancel`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Cancel booking error:', error);
    throw error;
  }
};

// ===== USER APIs =====

/**
 * Get current user data from database
 */
export const fetchCurrentUser = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: getAuthHeaders()
    });
    return response.data.user;
  } catch (error) {
    console.error('Fetch current user error:', error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userData) => {
  try {
    const response = await axios.put(
      `${BASE_URL}/api/auth/update-profile`,
      userData,
      { headers: getAuthHeaders() }
    );
    return response.data.user;
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
};

// ===== VEHICLE APIs =====

/**
 * Fetch all available vehicles
 */
export const fetchVehicles = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${BASE_URL}/api/vehicles${queryParams ? `?${queryParams}` : ''}`;
    const response = await axios.get(url);
    return response.data.vehicles || [];
  } catch (error) {
    console.error('Fetch vehicles error:', error);
    throw error;
  }
};

/**
 * Get user's own vehicles
 */
export const fetchUserVehicles = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/vehicles/user`, {
      headers: getAuthHeaders()
    });
    return response.data.vehicles || [];
  } catch (error) {
    console.error('Fetch user vehicles error:', error);
    throw error;
  }
};

// ===== STATISTICS APIs =====

/**
 * Get user statistics (bookings, earnings, etc.)
 */
export const fetchUserStatistics = async () => {
  try {
    const [bookings, transactions] = await Promise.all([
      fetchUserBookings(),
      fetchTransactionHistory()
    ]);
    
    // Calculate statistics
    const totalBookings = bookings.length;
    const activeBookings = bookings.filter(b => b.status === 'CONFIRMED').length;
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;
    
    const totalEarnings = transactions
      .filter(t => t.type === 'CREDIT' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalSpent = transactions
      .filter(t => t.type === 'DEBIT' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalBookings,
      activeBookings,
      completedBookings,
      totalEarnings,
      totalSpent,
      netFlow: totalEarnings - totalSpent
    };
  } catch (error) {
    console.error('Fetch user statistics error:', error);
    throw error;
  }
};

export default {
  fetchTransactionHistory,
  processPayment,
  clearTransactionHistory,
  fetchUserBookings,
  fetchRentalRequests,
  cancelBooking,
  fetchCurrentUser,
  updateUserProfile,
  fetchVehicles,
  fetchUserVehicles,
  fetchUserStatistics
};
