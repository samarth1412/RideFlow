import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Users, Fuel, Settings, ArrowLeft, CheckCircle, Clock, MapPin, Star, AlertCircle, Shield } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import { formatUSD } from '../../utils/money';

export default function BookNowPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get vehicle data from navigation state
  const vehicle = location.state?.vehicle || null;

  const [pickupDate, setPickupDate] = useState('');
  const [dropoffDate, setDropoffDate] = useState('');
  const [totalDays, setTotalDays] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [similarVehicles, setSimilarVehicles] = useState([]);

  // Set default dates (tomorrow and day after)
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    setPickupDate(tomorrow.toISOString().split('T')[0]);
    setDropoffDate(dayAfter.toISOString().split('T')[0]);
    
    // Scroll to top when vehicle changes
    window.scrollTo(0, 0);
  }, [vehicle?.id]);

  // Use actual image from Cloudinary, fallback to default
  const vehicleImage = vehicle?.image && vehicle.image !== '/photos/default-car.jpg'
    ? vehicle.image
    : "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80";

  const pricePerDay =
    (vehicle?.pricePerDay !== undefined && vehicle?.pricePerDay !== null)
      ? vehicle.pricePerDay
      : (vehicle?.price || 50);

  useEffect(() => {
    if (pickupDate && dropoffDate) {
      const pickup = new Date(pickupDate);
      const dropoff = new Date(dropoffDate);
      const diffTime = dropoff - pickup;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        setTotalDays(diffDays);
        setTotalPrice(diffDays * pricePerDay);
      }
    }
  }, [pickupDate, dropoffDate, pricePerDay]);

  // Fetch similar vehicles based on type
  useEffect(() => {
    const fetchSimilarVehicles = async () => {
      if (!vehicle) return;
      
      try {
        const res = await axios.get("/api/vehicles");
        
        // Filter vehicles of the same type, excluding current vehicle and user's own vehicles
        const similar = res.data.vehicles
          .filter(v => 
            v._id !== vehicle.id && // Not the current vehicle
            v.type === vehicle.type && // Same type
            v.status === 'active' && // Active vehicles
            (!user || (v.owner._id !== user.id && v.owner._id !== user._id)) // Not user's own vehicle
          )
          .slice(0, 4) // Get max 4 recommendations
          .map(v => ({
            id: v._id,
            name: v.name,
            plateNumber: v.plateNumber || null,
            owner: v.owner,
            make: v.make,
            model: v.model,
            year: v.year,
            type: v.type || 'car',
            image: v.image && v.image !== '/photos/default-car.jpg' 
              ? v.image 
              : "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500",
            pricePerDay: v.pricePerDay || 50,
            location: v.location || v.ownerLocation || "New York, NY",
            rating: v.rating || 0,
            totalRatings: v.totalRatings || 0,
            seats: v.seats || 4,
            fuel: v.fuelType || "Petrol",
            transmission: "Manual"
          }));
        
        setSimilarVehicles(similar);
      } catch (err) {
        console.error("Error fetching similar vehicles:", err);
      }
    };

    fetchSimilarVehicles();
  }, [vehicle, user]);

  const handleBooking = async () => {
    if (!vehicle) {
      alert("Vehicle information is missing");
      return;
    }

    if (!pickupDate || !dropoffDate) {
      alert("Please select pickup and drop-off dates");
      return;
    }

    const pickup = new Date(pickupDate);
    const dropoff = new Date(dropoffDate);
    
    if (dropoff <= pickup) {
      alert("Drop-off date must be after pickup date");
      return;
    }

    if (pickup < new Date().setHours(0, 0, 0, 0)) {
      alert("Pickup date cannot be in the past");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      
      await axios.post("/api/bookings", {
        vehicleId: vehicle.id,
        pickupDate,
        dropoffDate,
        totalDays,
        pricePerDay,
        totalPrice
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBookingSuccess(true);
      
      // Redirect to bookings page after 3 seconds
      setTimeout(() => {
        navigate('/my-bookings');
      }, 3000);

    } catch (err) {
      console.error("Booking error:", err);
      alert(err.response?.data?.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  // If no vehicle data, show error
  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Vehicle Not Found</h2>
            <p className="text-gray-600 mb-6">Please select a vehicle from the vehicles page</p>
            <button
              onClick={() => navigate('/vehicles')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Vehicles
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is trying to book their own vehicle
  // Debug logging
  console.log('Current User:', user);
  console.log('Vehicle Owner:', vehicle.owner);
  console.log('Vehicle Owner ID:', typeof vehicle.owner === 'object' ? vehicle.owner?._id || vehicle.owner?.id : vehicle.owner);
  console.log('User ID:', user?.id || user?._id);
  
  const isOwnVehicle = user && vehicle.owner && (
    // Check if owner is a string (just ID) - compare with user.id or user._id
    (typeof vehicle.owner === 'string' && (vehicle.owner === user.id || vehicle.owner === user._id)) ||
    // Check if owner is an object with _id - compare with user.id or user._id
    (typeof vehicle.owner === 'object' && vehicle.owner._id && (vehicle.owner._id === user.id || vehicle.owner._id === user._id)) ||
    // Check if owner is an object with id - compare with user.id or user._id
    (typeof vehicle.owner === 'object' && vehicle.owner.id && (vehicle.owner.id === user.id || vehicle.owner.id === user._id))
  );

  console.log('Is Own Vehicle:', isOwnVehicle);

  if (isOwnVehicle) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md mx-4">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Cannot Book Your Own Vehicle</h2>
            <p className="text-gray-600 mb-6">
              You cannot send a booking request for your own vehicle. Please browse other available vehicles.
            </p>
            <button
              onClick={() => navigate('/vehicles')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Browse Other Vehicles
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show success screen
  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Request Sent!</h2>
            <p className="text-gray-600 mb-4">
              Your booking request has been sent to the vehicle owner.
            </p>
            <div className="flex items-center justify-center gap-2 text-orange-600 mb-6">
              <Clock className="w-5 h-5" />
              <span className="text-sm">The owner has 5 minutes to respond</span>
            </div>
            <p className="text-sm text-gray-500">Redirecting to your bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/vehicles')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Vehicles</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Your Ride</h1>
            <p className="text-gray-600">Complete your booking details below</p>
          </div>

          {/* Optional verification (trust badge only — does not block booking) */}
          {!user?.isVerified && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-blue-900 mb-2">Optional: identity verification</h3>
                  <p className="text-blue-800 mb-4">
                    You can book without verifying. Uploading a government ID is optional and helps show a verified badge on your profile for trust.
                  </p>
                  {user?.verificationStatus === 'NOT_SUBMITTED' && (
                    <p className="text-sm text-blue-700 mb-4">
                      <strong>Status:</strong> Not submitted — add an ID from your profile anytime.
                    </p>
                  )}
                  {user?.verificationStatus === 'PENDING' && (
                    <p className="text-sm text-blue-700 mb-4">
                      <strong>Status:</strong> Under review. You can still complete this booking.
                    </p>
                  )}
                  {user?.verificationStatus === 'REJECTED' && (
                    <div className="mb-4">
                      <p className="text-sm text-red-700 font-semibold">
                        <strong>Last submission:</strong> Rejected
                      </p>
                      {user?.rejectionReason && (
                        <p className="text-sm text-red-600 mt-1">
                          <strong>Reason:</strong> {user.rejectionReason}
                        </p>
                      )}
                      <p className="text-sm text-blue-700 mt-1">You may upload a clearer document from your profile if you want the badge.</p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard?tab=profile')}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Go to Profile (optional)
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Vehicle Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Vehicle Card */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="aspect-video w-full overflow-hidden">
                  <img 
                    src={vehicleImage} 
                    alt={vehicle.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{vehicle.name}</h2>
                  <p className="text-gray-600 mb-2">
                    {vehicle.make} {vehicle.model} • {vehicle.year}
                  </p>
                  {vehicle.location && (
                    <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                      <MapPin size={16} />
                      <span>{vehicle.location}</span>
                    </p>
                  )}
                  {vehicle.plateNumber && (
                    <p className="text-sm text-gray-500 mb-4">
                      Plate Number: <span className="font-medium text-gray-700">{vehicle.plateNumber}</span>
                    </p>
                  )}
                  
                  {/* Rating and Bookings Info */}
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b">
                    <div className="flex items-center gap-1">
                      <Star className={`w-5 h-5 ${vehicle.rating > 0 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      <span className="text-sm font-semibold">{vehicle.rating ? vehicle.rating.toFixed(1) : '0.0'}</span>
                      <span className="text-xs text-gray-500">
                        ({vehicle.totalRatings || 0} {(vehicle.totalRatings || 0) === 1 ? 'rating' : 'ratings'})
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {vehicle.completedBookings === 0 ? 'New listing' : `${vehicle.completedBookings} ${vehicle.completedBookings === 1 ? 'trip' : 'trips'} completed`}
                    </div>
                  </div>
                  
                  {/* Vehicle Specs */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Users size={20} />
                      <span className="text-sm">{vehicle.seats} seats</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Fuel size={20} />
                      <span className="text-sm">{vehicle.fuel}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Settings size={20} />
                      <span className="text-sm">{vehicle.transmission || 'Manual'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Selection */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar size={24} />
                  Trip Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pickup */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pickup Date
                    </label>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Dropoff */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Drop-off Date
                    </label>
                    <input
                      type="date"
                      value={dropoffDate}
                      onChange={(e) => setDropoffDate(e.target.value)}
                      min={pickupDate}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-blue-800">
                    <strong>Trip Duration:</strong> {totalDays} {totalDays === 1 ? 'day' : 'days'}
                  </p>
                </div>
              </div>

            </div>

            {/* Right Column - Price Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                <h3 className="text-xl font-semibold mb-4">Booking Summary</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Price per day</span>
                    <span>{formatUSD(pricePerDay)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Number of days</span>
                    <span>{totalDays}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="text-xl font-bold">Total</span>
                    <span className="text-2xl font-bold text-blue-600">{formatUSD(totalPrice)}</span>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <Clock className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">Approval Required</p>
                      <p className="text-xs text-orange-600">
                        The owner has 5 minutes to approve or reject your booking request
                      </p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleBooking}
                  disabled={loading}
                  className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending Request...
                    </span>
                  ) : (
                    'Send Booking Request'
                  )}
                </button>

                <div className="mt-4 text-center space-y-1">
                  <p className="text-sm text-gray-500">You won&apos;t be charged until the owner approves</p>
                  {!user?.isVerified && (
                    <p className="text-xs text-gray-400">Verification is optional — see the note above if you want a verified badge.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Similar Vehicles Recommendations */}
          {similarVehicles.length > 0 && (
            <div className="max-w-6xl mx-auto mt-12 px-4 md:px-0">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Similar {vehicle.type === 'car' ? 'Cars' : vehicle.type === 'bike' ? 'Bikes' : 'Scooters'} You Might Like
                </h2>
                <p className="text-gray-600">Explore other {vehicle.type}s available for booking</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {similarVehicles.map((similarVehicle) => (
                  <div
                    key={similarVehicle.id}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                    onClick={() => navigate('/book-now', { state: { vehicle: similarVehicle } })}
                  >
                    {/* Image */}
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={similarVehicle.image}
                        alt={similarVehicle.name}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full text-xs font-bold text-gray-900">
                        {formatUSD(similarVehicle.pricePerDay)}/day
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                        {similarVehicle.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 truncate">
                        {similarVehicle.make} {similarVehicle.model} • {similarVehicle.year}
                      </p>

                      <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{similarVehicle.location}</span>
                      </div>

                      {/* Features */}
                      <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                        <div className="flex flex-col items-center">
                          <Users className="w-4 h-4 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-600">{similarVehicle.seats}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <Fuel className="w-4 h-4 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-600">{similarVehicle.fuel}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <Settings className="w-4 h-4 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-600">Manual</span>
                        </div>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/book-now', { state: { vehicle: similarVehicle } });
                        }}
                        className="w-full mt-3 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}