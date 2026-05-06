import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/common/Navbar";
import {
  Clock,
  Car,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  RefreshCw,
  MessageSquare
} from "lucide-react";
import { formatUSD } from "../../utils/money";

export default function RentalRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectionModal, setRejectionModal] = useState({ open: false, bookingId: null });
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/bookings/owner", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRequests(res.data.bookings || []);
      } catch (err) {
        console.error("Fetch requests error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
    // Auto-refresh every 2 minutes
    const interval = setInterval(loadRequests, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/bookings/owner", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data.bookings || []);
    } catch (err) {
      console.error("Fetch requests error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, status, reason = '') => {
    setActionLoading(bookingId);
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `/api/bookings/${bookingId}/status`,
        { status, rejectionReason: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRequests();
      setRejectionModal({ open: false, bookingId: null });
      setRejectionReason('');
    } catch (err) {
      console.error("Update status error:", err);
      alert(err.response?.data?.message || "Failed to update booking status");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status, paymentStatus) => {
    // Special case: Confirmed but awaiting payment
    if (status === 'CONFIRMED' && paymentStatus !== 'COMPLETED') {
      return (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4" />
            Booking Confirmed
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">
            <AlertCircle className="w-3 h-3" />
            Awaiting Payment
          </span>
        </div>
      );
    }

    const statusConfig = {
      PENDING: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: Clock,
        label: "Pending"
      },
      CONFIRMED: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircle,
        label: "Confirmed"
      },
      REJECTED: {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: XCircle,
        label: "Rejected"
      },
      CANCELLED: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        icon: XCircle,
        label: "Cancelled by User"
      },
      COMPLETED: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        icon: CheckCircle,
        label: "Completed"
      }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m to respond`;
  };

  // Separate pending requests from others
  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const otherRequests = requests.filter(r => r.status !== 'PENDING');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rental Requests</h1>
            <p className="text-gray-600 mt-1">Manage booking requests for your vehicles</p>
          </div>
          <button
            onClick={fetchRequests}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-yellow-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-800">{pendingRequests.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">Confirmed</p>
                <p className="text-2xl font-bold text-green-800">
                  {requests.filter(r => r.status === 'CONFIRMED').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600">Total Requests</p>
                <p className="text-2xl font-bold text-blue-800">{requests.length}</p>
              </div>
            </div>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Rental Requests</h3>
            <p className="text-gray-500 mb-6">You haven't received any booking requests yet</p>
            <button
              onClick={() => navigate("/manage-vehicles")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Manage My Vehicles
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Requests Section */}
            {pendingRequests.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  Awaiting Your Response ({pendingRequests.length})
                </h2>
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-yellow-400"
                    >
                      <div className="p-6">
                        <div className="md:flex md:gap-6">
                          {/* Vehicle Info */}
                          <div className="md:w-48 mb-4 md:mb-0">
                            <img
                              src={request.vehicle?.image && request.vehicle.image !== '/photos/default-car.jpg'
                                ? request.vehicle.image
                                : "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500"}
                              alt={request.vehicle?.name}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <p className="mt-2 font-semibold text-gray-900">{request.vehicle?.name}</p>
                          </div>

                          {/* Request Details */}
                          <div className="flex-1">
                            {/* Renter Info */}
                            <div className="flex items-center gap-3 mb-4">
                              <img
                                src={request.user?.picture || "https://via.placeholder.com/40"}
                                alt={request.user?.name}
                                className="w-10 h-10 rounded-full"
                              />
                              <div>
                                <p className="font-semibold text-gray-900">{request.user?.name}</p>
                                <p className="text-sm text-gray-500">{request.user?.email}</p>
                              </div>
                            </div>

                            {/* Dates and Price */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-gray-500">Pickup</p>
                                <p className="font-medium text-sm">{formatDate(request.pickupDate)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Drop-off</p>
                                <p className="font-medium text-sm">{formatDate(request.dropoffDate)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Duration</p>
                                <p className="font-medium text-sm">{request.totalDays} days</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Total</p>
                                <p className="font-semibold text-blue-600">{formatUSD(request.totalPrice)}</p>
                              </div>
                            </div>

                            {/* Message */}
                            {request.message && (
                              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                  <MessageSquare className="w-4 h-4" />
                                  <span className="text-sm font-medium">Message from renter</span>
                                </div>
                                <p className="text-sm text-gray-700">{request.message}</p>
                              </div>
                            )}

                            {/* Timer */}
                            <div className="flex items-center gap-2 text-orange-600 mb-4">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {getTimeRemaining(request.expiresAt)}
                              </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => updateBookingStatus(request._id, 'CONFIRMED')}
                                disabled={actionLoading === request._id}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectionModal({ open: true, bookingId: request._id })}
                                disabled={actionLoading === request._id}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Requests Section */}
            {otherRequests.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Past Requests ({otherRequests.length})
                </h2>
                <div className="space-y-4">
                  {otherRequests.map((request) => (
                    <div
                      key={request._id}
                      className="bg-white rounded-xl shadow-sm p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <img
                            src={request.vehicle?.image && request.vehicle.image !== '/photos/default-car.jpg'
                              ? request.vehicle.image
                              : "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500"}
                            alt={request.vehicle?.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div>
                            <p className="font-semibold text-gray-900">{request.vehicle?.name}</p>
                            <p className="text-sm text-gray-600">
                              {request.user?.name} • {formatDate(request.pickupDate)} - {formatDate(request.dropoffDate)}
                            </p>
                            <p className="text-sm font-medium text-blue-600">{formatUSD(request.totalPrice)}</p>
                          </div>
                        </div>
                        {getStatusBadge(request.status, request.paymentStatus)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectionModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Reject Booking</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejection (optional)</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Vehicle is not available for these dates..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-4"
            />
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => {
                  setRejectionModal({ open: false, bookingId: null });
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateBookingStatus(rejectionModal.bookingId, 'REJECTED', rejectionReason)}
                disabled={actionLoading === rejectionModal.bookingId}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
