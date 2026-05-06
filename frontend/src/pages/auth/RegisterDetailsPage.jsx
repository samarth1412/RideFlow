import React, { useState } from 'react';
import { Car, Bike, Truck, ArrowRight, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { US_LOCATIONS } from '../../constants/usLocations';

export default function RegisterDetailsPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    city: ''
  });

  const slides = [
    {
      title: "Almost There!",
      subtitle: "Just a few more details to complete your profile",
      icon: Car,
      gradient: "from-blue-500 to-cyan-400"
    },
    {
      title: "Start Your Journey",
      subtitle: "Access thousands of vehicles in your area",
      icon: Truck,
      gradient: "from-blue-600 to-indigo-500"
    },
    {
      title: "Easy & Convenient",
      subtitle: "Book vehicles anytime, anywhere",
      icon: Bike,
      gradient: "from-cyan-500 to-blue-500"
    }
  ];

  const handleSubmit = async () => {
    if (!formData.phone || !formData.city) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/auth/complete-profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(' Profile completed:', response.data);
      
      // Update user in context
      updateUser(response.data.user);
      
      alert(`Welcome ${user.name}! Your profile is complete.`);
      navigate('/home');
    } catch (error) {
      console.error('Profile completion error:', error);
      alert(error.response?.data?.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AuthLayout 
      slides={slides}
      backgroundColor="from-indigo-900 via-purple-900 to-blue-900"
      rightBgColor="from-white to-blue-50"
      particleColors={{
        particle1: "purple",
        particle2: "blue",
        particle3: "cyan",
        particle4: "indigo",
        particle5: "purple"
      }}
    >
      <div className="flex flex-col justify-center">
        {/* Header with user info */}
        <div className="mb-8 text-center">
          <img 
            src={user?.picture} 
            alt={user?.name}
            className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-blue-100"
          />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-gray-600">Complete your profile to get started</p>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, "");
                  if (value.length > 10) value = value.slice(0, 10);
                  handleInputChange("phone", value);
                }}
                maxLength={10}
                placeholder="5551234567"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-gray-800 placeholder-gray-400"
              />
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              City
            </label>
            <select
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-gray-800 bg-white"
            >
              <option value="">Select your city</option>
              {US_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 group shadow-xl shadow-blue-500/50 hover:shadow-2xl hover:shadow-blue-600/50 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Complete Registration'}
            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}