import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import {
  Car,
  MapPin,
  Users,
  Fuel,
  Settings,
  Star
} from "lucide-react";
import { US_LOCATIONS } from "../constants/usLocations";
import { formatUSD } from "../utils/money";

export default function VehiclesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [searchParams] = useState(location.state || {});
  const [sortBy, setSortBy] = useState('recommended');
  const [searchLocation, setSearchLocation] = useState(location.state?.location || '');
  const [searchVehicleType, setSearchVehicleType] = useState(location.state?.vehicleType || 'all');

useEffect(() => {
  const fetchVehicles = async () => {
    try {
      const res = await axios.get("/api/vehicles");

      const mappedVehicles = res.data.vehicles.map((v) => ({
        id: v._id,
        name: v.name,
        plateNumber: v.plateNumber || null,
        owner: v.owner,
        ownerName: v.owner?.name || (typeof v.owner === 'string' ? v.owner : 'Unknown'),
        ownerEmail: v.owner?.email || '',
        make: v.make,
        model: v.model,
        year: v.year,
        type: v.type || 'car',
        // 🔹 Use actual image from Cloudinary, fallback to default
        image: v.image && v.image !== '/photos/default-car.jpg' 
          ? v.image 
          : "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500",
        	pricePerDay: (v.pricePerDay !== undefined && v.pricePerDay !== null) ? v.pricePerDay : 50,
        ownerLocation: v.ownerLocation || null,
        status: v.status || 'active',
        createdAt: v.createdAt,
        location: v.location || v.ownerLocation || "New York, NY",
        rating: v.rating || 0,
        totalRatings: v.totalRatings || 0,
        completedBookings: v.completedBookings || 0,
        seats: v.seats || 4,
        fuel: v.fuelType || "Petrol",
        transmission: "Manual"
      }));

      setVehicles(mappedVehicles);
    } catch (err) {
      console.log("Fetch vehicles error:", err);
    }
  };

  fetchVehicles();
}, []);

  // Fetch recommendations for logged-in user
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user || !user._id) return;
      
      try {
        const res = await axios.get(`/api/recommendations/${user._id}?limit=6`);
        
        if (res.data.recommendations) {
          const mappedRecs = res.data.recommendations.map((rec) => ({
            id: rec.vehicle._id,
            name: rec.vehicle.name,
            plateNumber: rec.vehicle.plateNumber || null,
            owner: rec.vehicle.owner,
            ownerName: rec.vehicle.owner?.name || 'Unknown',
            ownerEmail: rec.vehicle.owner?.email || '',
            make: rec.vehicle.make,
            model: rec.vehicle.model,
            year: rec.vehicle.year,
            type: rec.vehicle.type || 'car',
            image: rec.vehicle.image && rec.vehicle.image !== '/photos/default-car.jpg' 
              ? rec.vehicle.image 
              : "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500",
            pricePerDay: rec.vehicle.pricePerDay || 50,
            ownerLocation: rec.vehicle.ownerLocation || null,
            status: rec.vehicle.status || 'active',
            location: rec.vehicle.location || rec.vehicle.ownerLocation || "New York, NY",
            rating: rec.vehicle.rating || 0,
            totalRatings: rec.vehicle.totalRatings || 0,
            completedBookings: rec.vehicle.completedBookings || 0,
            seats: rec.vehicle.seats || 4,
            fuel: rec.vehicle.fuelType || "Petrol",
            transmission: "Manual",
            // Recommendation specific
            score: rec.score,
            reasons: rec.reasons || []
          }));
          setRecommendations(mappedRecs);
        }
      } catch (err) {
        console.log("Fetch recommendations error:", err);
        setRecommendations([]);
      }
    };

    fetchRecommendations();
  }, [user]);

  // Filter logic with search
  const filteredVehicles = vehicles.filter((vehicle) => {
    // Location filter
    if (searchLocation && searchLocation !== "all" && vehicle.location !== searchLocation) {
      return false;
    }
    
    // Vehicle type filter
    if (searchVehicleType && searchVehicleType !== "all" && vehicle.type !== searchVehicleType) {
      return false;
    }
    
    // Legacy filter from search params
    if (searchParams.vehicleType && searchParams.vehicleType !== "all" && vehicle.type !== searchParams.vehicleType) {
      return false;
    }
    
    return true;
  });

  // Sorting logic
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    switch(sortBy) {
      case 'price-low':
        return a.pricePerDay - b.pricePerDay;
      case 'price-high':
        return b.pricePerDay - a.pricePerDay;
      case 'rating':
        return b.rating - a.rating;
      case 'recommended':
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Available Vehicles
          </h1>

          {searchParams.location && (
            <p className="text-blue-100 text-lg">
              Showing results for {searchParams.location}
            </p>
          )}
        </div>
      </div>

      {/* Filters & Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Recommended for You Section */}
        {user && recommendations.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-400 fill-current" />
                  Recommended for You
                </h2>
                <p className="text-gray-600 mt-1">Based on your booking history and preferences</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((vehicle) => {
                const isOwnVehicle = user && vehicle.owner && (
                  (typeof vehicle.owner === 'string' && (vehicle.owner === user.id || vehicle.owner === user._id)) ||
                  (typeof vehicle.owner === 'object' && vehicle.owner._id && (vehicle.owner._id === user.id || vehicle.owner._id === user._id)) ||
                  (typeof vehicle.owner === 'object' && vehicle.owner.id && (vehicle.owner.id === user.id || vehicle.owner.id === user._id))
                );
                
                return (
                <div
                  key={vehicle.id}
                  className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all border-2 border-blue-200 ${
                    isOwnVehicle ? 'cursor-default' : 'cursor-pointer'
                  }`}
                  onClick={() => !isOwnVehicle && navigate('/book-now', { state: { vehicle } })}
                >
                  {/* Recommendation Badge */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 text-sm font-semibold flex items-center gap-2">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="truncate">{vehicle.reasons[0] || 'Recommended'}</span>
                  </div>

                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={vehicle.image}
                      alt={vehicle.name}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-bold text-gray-900">
                      {formatUSD(vehicle.pricePerDay)}/day
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {vehicle.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {vehicle.make} {vehicle.model} • {vehicle.year}
                    </p>

                    <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{vehicle.location}</span>
                    </div>

                    {/* Recommendation Reasons */}
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {vehicle.reasons.slice(0, 3).map((reason, idx) => (
                          <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>

                    {vehicle.plateNumber && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">
                          Plate: <span className="font-medium text-gray-700">{vehicle.plateNumber}</span>
                        </p>
                      </div>
                    )}

                    {/* Features */}
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                      <div className="flex flex-col items-center">
                        <Users className="w-5 h-5 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-600">
                          {vehicle.seats} Seats
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Fuel className="w-5 h-5 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-600">
                          {vehicle.fuel}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Settings className="w-5 h-5 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-600">
                          {vehicle.transmission}
                        </span>
                      </div>
                    </div>

                    {/* Check if current user is the owner */}
                    {isOwnVehicle ? (
                      <div className="w-full mt-4 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-lg text-center">
                        Your Vehicle
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/book-now', { state: { vehicle } });
                        }}
                        className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all"
                      >
                        Book Now
                      </button>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Divider */}
        {user && recommendations.length > 0 && (
          <div className="border-t border-gray-200 mb-12 pt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">All Available Vehicles</h2>
          </div>
        )}
        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Location Search */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <select
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white appearance-none"
                >
                  <option value="">All Locations</option>
                  {US_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Vehicle Type
              </label>
              <div className="relative">
                <Car className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <select
                  value={searchVehicleType}
                  onChange={(e) => setSearchVehicleType(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white appearance-none"
                >
                  <option value="all">All Types</option>
                  <option value="car">Car</option>
                  <option value="bike">Bike</option>
                  <option value="scooter">Scooter</option>
                </select>
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
              >
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <p className="text-gray-600">
            Found{" "}
            <span className="font-bold text-gray-900">
              {sortedVehicles.length}
            </span>{" "}
            vehicles
          </p>
        </div>

        {/* Vehicle Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedVehicles.map((vehicle) => {
            const isOwnVehicle = user && vehicle.owner && (
              (typeof vehicle.owner === 'string' && (vehicle.owner === user.id || vehicle.owner === user._id)) ||
              (typeof vehicle.owner === 'object' && vehicle.owner._id && (vehicle.owner._id === user.id || vehicle.owner._id === user._id)) ||
              (typeof vehicle.owner === 'object' && vehicle.owner.id && (vehicle.owner.id === user.id || vehicle.owner.id === user._id))
            );
            
            return (
            <div
              key={vehicle.id}
              className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow ${
                isOwnVehicle ? 'cursor-default' : 'cursor-pointer'
              }`}
              onClick={() => !isOwnVehicle && navigate('/book-now', { state: { vehicle } })}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={vehicle.image}
                  alt={vehicle.name}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                />

                <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-bold text-gray-900">
                  {formatUSD(vehicle.pricePerDay)}/day
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {vehicle.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {vehicle.make} {vehicle.model} • {vehicle.year}
                </p>

                <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{vehicle.location}</span>
                </div>

                {vehicle.plateNumber && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">
                      Plate: <span className="font-medium text-gray-700">{vehicle.plateNumber}</span>
                    </p>
                  </div>
                )}

                {/* Features */}
                <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                  <div className="flex flex-col items-center">
                    <Users className="w-5 h-5 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-600">
                      {vehicle.seats} Seats
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <Fuel className="w-5 h-5 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-600">
                      {vehicle.fuel}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <Settings className="w-5 h-5 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-600">
                      {vehicle.transmission}
                    </span>
                  </div>
                </div>

                {/* Check if current user is the owner */}
                {isOwnVehicle ? (
                  <div className="w-full mt-4 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-lg text-center">
                    Your Vehicle
                  </div>
                ) : (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/book-now', { state: { vehicle } });
                    }}
                    className="w-full mt-4 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                  >
                    Book Now
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
