import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/common/Navbar";
import { 
  ArrowLeft, 
  Car, 
  MapPin, 
  Fuel, 
  Users, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Plus,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { formatUSD } from "../../utils/money";

export default function ManageVehiclesPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeBookings, setActiveBookings] = useState({});

  useEffect(() => {
    fetchUserVehicles();
    fetchActiveBookings();
  }, []);

  const fetchUserVehicles = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/vehicles/my-vehicles", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVehicles(res.data.vehicles || []);
    } catch (err) {
      console.error("Fetch vehicles error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/bookings/rental-requests", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Create a map of vehicle ID to active booking info
      const bookingsMap = {};
      if (res.data.bookings) {
        res.data.bookings.forEach(booking => {
          // Only include confirmed bookings with completed payments
          if (booking.status === 'CONFIRMED' && booking.paymentStatus === 'COMPLETED') {
            const vehicleId = booking.vehicle?._id || booking.vehicle;
            bookingsMap[vehicleId] = {
              renterName: booking.user?.name || 'User',
              renterEmail: booking.user?.email || '',
              pickupDate: booking.pickupDate,
              dropoffDate: booking.dropoffDate,
              totalPrice: booking.totalPrice,
              status: booking.status,
              paymentStatus: booking.paymentStatus
            };
          }
        });
      }
      setActiveBookings(bookingsMap);
    } catch (err) {
      console.error("Fetch bookings error:", err);
    }
  };

  const toggleVehicleStatus = async (vehicleId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    setActionLoading(vehicleId);
    
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `/api/vehicles/${vehicleId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setVehicles(vehicles.map(v => 
        v._id === vehicleId ? { ...v, status: newStatus } : v
      ));
    } catch (err) {
      console.error("Toggle status error:", err);
      alert("Failed to update vehicle status");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteVehicle = async (vehicleId) => {
    // Check if vehicle has active booking
    if (activeBookings[vehicleId]) {
      alert("Cannot delete a vehicle that is currently rented. Please wait for the rental period to end.");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this vehicle?")) return;
    
    setActionLoading(vehicleId);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/vehicles/${vehicleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setVehicles(vehicles.filter(v => v._id !== vehicleId));
    } catch (err) {
      console.error("Delete vehicle error:", err);
      alert("Failed to delete vehicle");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar />
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/become-host")}
                className="mr-4 p-2 bg-white text-gray-700 rounded-lg shadow hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Manage My Vehicles</h1>
                <p className="text-gray-600 mt-1">Control your vehicle listings</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/add-vehicle")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
            <Plus className="w-5 h-5" />
            Add New
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Car className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Listings</p>
                <p className="text-2xl font-bold text-green-600">
                  {vehicles.filter(v => v.status === "active").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Inactive Listings</p>
                <p className="text-2xl font-bold text-orange-600">
                  {vehicles.filter(v => v.status === "inactive").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Vehicles List */}
        {vehicles.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Vehicles Yet</h3>
            <p className="text-gray-500 mb-6">Start by adding your first vehicle to rent</p>
            <button
              onClick={() => navigate("/add-vehicle")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Vehicle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle._id}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ${
                  vehicle.status === "inactive" ? "opacity-75" : ""
                }`}
              >
                {/* Vehicle Image */}
                <div className="relative h-48">
                  <img
                    src={vehicle.image && vehicle.image !== '/photos/default-car.jpg' 
                      ? vehicle.image 
                      : "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500"}
                    alt={vehicle.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Status Badge */}
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-semibold ${
                    vehicle.status === "active" 
                      ? "bg-green-500 text-white" 
                      : "bg-orange-500 text-white"
                  }`}>
                    {vehicle.status === "active" ? "Active" : "Inactive"}
                  </div>
                  
                  {/* Currently Rented Badge */}
                  {activeBookings[vehicle._id] && (
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
                      🚗 Currently in Booking
                    </div>
                  )}
                </div>

                {/* Vehicle Info */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{vehicle.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {vehicle.make} {vehicle.model} • {vehicle.year}
                  </p>
                  <p className="text-gray-500 text-sm mb-3">Plate: {vehicle.plateNumber || '—'}</p>

                  {/* Details Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{vehicle.location}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{vehicle.seats} Seats</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Fuel className="w-4 h-4" />
                      <span>{vehicle.fuelType}</span>
                    </div>
                  </div>

                  {/* Current Booking Info */}
                  {activeBookings[vehicle._id] && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 text-blue-900 font-semibold mb-2 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Active Rental - Payment Completed
                      </div>
                      <div className="text-xs text-gray-700 space-y-1">
                        <p><strong>Rented by:</strong> {activeBookings[vehicle._id].renterName}</p>
                        <p><strong>Pickup:</strong> {new Date(activeBookings[vehicle._id].pickupDate).toLocaleDateString()}</p>
                        <p><strong>Return:</strong> {new Date(activeBookings[vehicle._id].dropoffDate).toLocaleDateString()}</p>
                        <p><strong>Amount:</strong> {formatUSD(activeBookings[vehicle._id].totalPrice)}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-4 border-t">
                    {/* Toggle Status - Disabled for active rentals */}
                    <button
                      onClick={() => toggleVehicleStatus(vehicle._id, vehicle.status)}
                      disabled={actionLoading === vehicle._id || activeBookings[vehicle._id]}
                      title={activeBookings[vehicle._id] ? "Cannot change status while vehicle is rented" : ""}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        vehicle.status === "active"
                          ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      } ${actionLoading === vehicle._id || activeBookings[vehicle._id] ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {actionLoading === vehicle._id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : vehicle.status === "active" ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          <span>Set Inactive</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          <span>Set Active</span>
                        </>
                      )}
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => navigate(`/edit-vehicle/${vehicle._id}`)}
                      className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      title="Edit Vehicle"
                    >
                      <Edit className="w-5 h-5" />
                    </button>

                    {/* Delete Button - Disabled for active rentals */}
                    <button
                      onClick={() => deleteVehicle(vehicle._id)}
                      disabled={actionLoading === vehicle._id || activeBookings[vehicle._id]}
                      title={activeBookings[vehicle._id] ? "Cannot delete while vehicle is rented" : "Delete Vehicle"}
                      className={`p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors ${
                        activeBookings[vehicle._id] ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
