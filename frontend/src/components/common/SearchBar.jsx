import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { US_LOCATIONS } from '../../constants/usLocations';

export default function SearchBar({ onSearch }) {
  const [searchData, setSearchData] = useState({
    location: '',
    vehicleType: 'all'
  });

  const handleInputChange = (field, value) => {
    setSearchData(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    // Allow search even without location selected
    onSearch(searchData);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl mx-auto -mt-8 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Pickup Location */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Pickup Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={searchData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none bg-white text-gray-800"
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
          <select
            value={searchData.vehicleType}
            onChange={(e) => handleInputChange('vehicleType', e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none bg-white text-gray-800"
          >
            <option value="all">All Vehicles</option>
            <option value="car">Cars</option>
            <option value="bike">Bikes</option>
            <option value="scooter">Scooters</option>
          </select>
        </div>

        {/* Search Button */}
        <div>
          <button
            onClick={handleSearch}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Search className="w-5 h-5" />
            Search Vehicles
          </button>
        </div>
      </div>
    </div>
  );
}