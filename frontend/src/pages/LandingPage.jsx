import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import SearchBar from '../components/common/SearchBar';
import { Car, DollarSign, Clock, ThumbsUp } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Vehicle images array - Add as many as you want!
  // Vehicle images array - Cleaned & corrected
const vehicleImages = [
  {
    url: '/photos/suzuki_swift.jpg',
    title: 'Suzuki Swift',
    description: 'A compact and fuel-efficient hatchback for daily use'
  },
  {
    url: '/photos/beneli302s.jpg',
    title: 'Benelli 302S',
    description: 'A stylish sports bike with powerful performance'
  },
  {
    url: '/photos/fortuner.jpg',
    title: 'Toyota Fortuner',
    description: 'A premium SUV built for comfort and adventure'
  },
  {
    url: '/photos/ktmduke390.jpg',
    title: 'KTM Duke 390',
    description: 'A lightweight street bike with aggressive power'
  },
  
  {
    url: '/photos/tesla-roadster.jpg',
    title: 'Tesla Roadster',
    description: 'An electric supercar known for extreme speed'
  },
  {
    url: '/photos/hunter_royal_enfield.jpg',
    title: 'Royal Enfield Hunter 350',
    description: 'A modern classic bike with urban styling'
  }
];

  // Auto-rotate images every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === vehicleImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [vehicleImages.length]);

  const goToSlide = (index) => {
    setCurrentImageIndex(index);
  };

  const handleSearch = (searchData) => {
    console.log('Search data:', searchData);
    navigate('/vehicles', { state: searchData });
  };

  const features = [
    {
      icon: DollarSign,
      title: 'Best Prices',
      description: 'Affordable rates with no hidden charges'
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Round the clock customer assistance'
    },
    {
      icon: Car,
      title: 'Wide Vehicle Selection',
      description: 'Choose from economy, luxury, and premium cars'
    },
    {
      icon: ThumbsUp,
      title: 'Easy & Fast Booking',
      description: 'Book your ride in just a few clicks'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

{/* Hero Section - Compact Version */}
<section className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 pt-12 pb-24 overflow-hidden">
  {/* Animated Background Effects */}
  <div className="absolute inset-0 opacity-10">
    <div className="absolute top-0 -left-4 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
    <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
  </div>

  <style>{`
    @keyframes blob {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
    }
    .animate-blob {
      animation: blob 7s infinite;
    }
    .animation-delay-2000 {
      animation-delay: 2s;
    }
    .animation-delay-4000 {
      animation-delay: 4s;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .fade-in {
      animation: fadeIn 0.8s ease-out;
    }
  `}</style>

  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
    {/* Compact Header */}
    <div className="text-center mb-8">
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-12">
        Cars & Bikes on Rent
      </h1>
      <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-6 -mt-9">
  Find the perfect vehicle for any journey
</p>

      {/* Search Bar - Inline */}
      <div className="max-w-4xl mx-auto mt-14">
        <SearchBar onSearch={handleSearch} />
      </div>
    </div>

   {/* Rotating Vehicle Carousel - Same Page */}
<div className="relative max-w-6xl mx-auto mt-8">
  <div className="relative h-80 md:h-96 rounded-2xl overflow-hidden shadow-2xl">

    {/* Images */}
    {vehicleImages.map((image, index) => (
      <div
        key={index}
        className={`absolute inset-0 transition-opacity duration-1000 ${
          index === currentImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
        }`}
      >
        <img
          src={image.url}
          alt={image.title}
          className="w-full h-full object-cover"
        />

        {/* Overlay with title */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
          <h3 className="text-white text-2xl md:text-3xl font-bold mb-1">
            {image.title}
          </h3>
          <p className="text-blue-200 text-base md:text-lg">
            {image.description}
          </p>
        </div>
      </div>
    ))}


        {/* Dot Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {vehicleImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentImageIndex
                  ? 'w-8 h-3 bg-white'
                  : 'w-3 h-3 bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
</section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Why Choose RideFlow?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-xl hover:shadow-xl transition-shadow bg-gray-50"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Search Vehicles
              </h3>
              <p className="text-gray-600">
                Find the perfect car or bike by location
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Book Instantly
              </h3>
              <p className="text-gray-600">
                Choose your vehicle and complete booking in minutes
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Hit the Road
              </h3>
              <p className="text-gray-600">
                Pick up your vehicle and enjoy your journey
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join us and find your perfect ride today
          </p>
          <button
            onClick={() => navigate('/vehicles')}
            className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors text-lg shadow-xl"
          >
            Browse Vehicles
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <div>
            <h3 className="text-xl font-bold mb-4 text-center">RideFlow</h3>
            <p className="text-gray-400 text-center">
              Your trusted peer-to-peer vehicle rental platform
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 RideFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}