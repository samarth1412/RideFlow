import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Calendar,
  MapPin,
  Clock,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  RefreshCw,
  Car,
  Phone,
  Mail
} from "lucide-react";
import PaymentModal from "../../components/PaymentModal";
import Navbar from "../../components/common/Navbar";
import { formatUSD } from "../../utils/money";

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [recentPayment, setRecentPayment] = useState(null);

  useEffect(() => {
    fetchBookings();
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchBookings, 120000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.error("No token found - user not logged in");
        alert("Please login to view your bookings");
        navigate("/login");
        return;
      }

      console.log("Fetching bookings with token:", token.substring(0, 20) + "...");
      
      const res = await axios.get("/api/bookings/user", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Bookings response:", res.data);
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error("Fetch bookings error:", err);
      console.error("Error response:", err.response?.data);
      
      if (err.response?.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        alert("Failed to load bookings: " + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    
    setCancelling(bookingId);
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`/api/bookings/${bookingId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBookings();
    } catch (err) {
      console.error("Cancel booking error:", err);
      alert(err.response?.data?.message || "Failed to cancel booking");
    } finally {
      setCancelling(null);
    }
  };

  const handleProceedToPayment = (booking) => {
    if (booking.paymentStatus === 'COMPLETED') {
      alert('This booking has already been paid for.');
      return;
    }
    setSelectedBooking(booking);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (paymentData) => {
    setBookings((prev) => prev.map((booking) => {
      if (booking._id === paymentData.bookingId) {
        return {
          ...booking,
          paymentStatus: 'COMPLETED',
          paymentMethod: paymentData.paymentMethod,
          transactionId: paymentData.transactionId,
          paidAt: paymentData.date || new Date().toISOString()
        };
      }
      return booking;
    }));
    setRecentPayment({
      bookingId: paymentData.bookingId,
      transactionId: paymentData.transactionId,
      amount: paymentData.amount
    });
    setIsPaymentModalOpen(false);
    setSelectedBooking(null);

    setTimeout(() => {
      setRecentPayment(null);
    }, 10000);
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
        label: "Pending Approval"
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
        label: "Cancelled"
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

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
            <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-600 mt-1">Track your vehicle booking requests</p>
          </div>
          <button
            onClick={fetchBookings}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Payment Success Banner */}
        {recentPayment && (
          <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6 mb-6 shadow-lg animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500 rounded-full">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-green-900 mb-1">🎉 Payment Successful!</h3>
                <p className="text-green-800 text-sm mb-3">
                  Your booking is now confirmed and ready. Check your email for pickup details.
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg">
                    <CreditCard className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700 font-mono">{recentPayment.transactionId}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-green-700">{formatUSD(recentPayment.amount)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setRecentPayment(null)}
                className="text-green-600 hover:text-green-800 font-bold text-xl"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Bookings Yet</h3>
            <p className="text-gray-500 mb-6">Start by booking a vehicle</p>
            <button
              onClick={() => navigate("/vehicles")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Vehicles
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                <div className="md:flex">
                  {/* Vehicle Image */}
                  <div className="md:w-64 h-48 md:h-auto">
                    <img
                      src={booking.vehicle?.image && booking.vehicle.image !== '/photos/default-car.jpg'
                        ? booking.vehicle.image
                        : "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500"}
                      alt={booking.vehicle?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Booking Details */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {booking.vehicle?.name}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {booking.vehicle?.make} {booking.vehicle?.model}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {getStatusBadge(booking.status, booking.paymentStatus)}
                        {booking.paymentStatus === 'COMPLETED' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
                            <CheckCircle className="w-3 h-3" />
                            PAID
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          {formatDate(booking.pickupDate)} → {formatDate(booking.dropoffDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{booking.vehicle?.location}</span>
                      </div>
                    </div>

                    {/* Price and Duration */}
                    <div className="flex items-center gap-6 mb-4">
                      <div>
                        <span className="text-sm text-gray-500">Duration</span>
                        <p className="font-semibold">{booking.totalDays} days</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Total Price</span>
                        <p className="font-semibold text-blue-600">{formatUSD(booking.totalPrice)}</p>
                      </div>
                      {booking.paymentStatus && (
                        <div>
                          <span className="text-sm text-gray-500">Payment</span>
                          <p className={`font-semibold ${
                            booking.paymentStatus === 'COMPLETED' ? 'text-green-600' : 
                            booking.paymentStatus === 'FAILED' ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {booking.paymentStatus}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Payment Info - Show when payment completed */}
                    {booking.paymentStatus === 'COMPLETED' && booking.transactionId && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-4 mb-4 shadow-sm">
                        <div className="flex items-center gap-2 text-green-800 mb-3">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-bold">✅ Booking Confirmed - Payment Successful</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-green-700">
                          <div className="bg-white rounded px-3 py-2">
                            <p className="text-gray-500 mb-0.5">Transaction ID</p>
                            <p className="font-mono font-semibold">{booking.transactionId}</p>
                          </div>
                          <div className="bg-white rounded px-3 py-2">
                            <p className="text-gray-500 mb-0.5">Payment Method</p>
                            <p className="font-semibold">{booking.paymentMethod || 'Demo Payment'}</p>
                          </div>
                          {booking.paidAt && (
                            <div className="bg-white rounded px-3 py-2 sm:col-span-2">
                              <p className="text-gray-500 mb-0.5">Payment Date</p>
                              <p className="font-semibold">{new Date(booking.paidAt).toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-green-800 mt-3 font-medium">🚗 Your ride is ready! Contact the owner for pickup arrangements.</p>
                      </div>
                    )}

                    {booking.paymentStatus === 'COMPLETED' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 text-blue-900 mb-3">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm font-semibold">Pickup & Owner Contact</span>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 text-sm text-gray-700">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-0.5 text-blue-600" />
                            <div>
                              <p className="text-xs text-gray-500">Pickup Location</p>
                              <p className="font-semibold text-gray-900">{booking.vehicle?.location || 'Owner will share exact spot'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Phone className="w-4 h-4 mt-0.5 text-blue-600" />
                            <div>
                              <p className="text-xs text-gray-500">Owner Phone</p>
                              <p className="font-semibold text-gray-900">{booking.owner?.phone || 'Not provided yet'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Mail className="w-4 h-4 mt-0.5 text-blue-600" />
                            <div>
                              <p className="text-xs text-gray-500">Owner Email</p>
                              <p className="font-semibold text-gray-900">{booking.owner?.email || 'Not provided'}</p>
                            </div>
                          </div>
                          {(booking.owner?.address || booking.owner?.city) && (
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 mt-0.5 text-blue-600" />
                              <div>
                                <p className="text-xs text-gray-500">Pickup Address</p>
                                <p className="font-semibold text-gray-900">
                                  {booking.owner?.address || booking.owner?.city}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-blue-900 mt-3">Use these details to coordinate pickup time with the owner.</p>
                      </div>
                    )}

                    {/* Pending Status Timer */}
                    {booking.status === 'PENDING' && (
                      <div className="flex items-center gap-2 text-orange-600 mb-4">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {getTimeRemaining(booking.expiresAt)}
                        </span>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {booking.status === 'REJECTED' && booking.rejectionReason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-700">
                          <strong>Reason:</strong> {booking.rejectionReason}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      {/* Payment Button - Show only for confirmed bookings without payment */}
                      {booking.status === 'CONFIRMED' && booking.paymentStatus !== 'COMPLETED' && (
                        <button
                          onClick={() => handleProceedToPayment(booking)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-md hover:shadow-lg"
                        >
                          <CreditCard className="w-4 h-4" />
                          Proceed to Payment
                        </button>
                      )}

                      {/* Show Already Paid message - No payment button when completed */}
                      {booking.status === 'CONFIRMED' && booking.paymentStatus === 'COMPLETED' && (
                        <div className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-lg text-sm font-medium border-2 border-green-300">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          Payment Completed - Ready to Ride
                        </div>
                      )}

                      {/* Cancel Button - Only show if payment is not completed */}
                      {['PENDING', 'CONFIRMED'].includes(booking.status) && booking.paymentStatus !== 'COMPLETED' && (
                        <button
                          onClick={() => cancelBooking(booking._id)}
                          disabled={cancelling === booking._id}
                          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          {cancelling === booking._id ? 'Cancelling...' : 'Cancel Booking'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal 
        booking={selectedBooking}
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedBooking(null);
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
