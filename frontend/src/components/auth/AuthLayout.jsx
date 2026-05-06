import React, { useState, useEffect } from 'react';
import { Car } from 'lucide-react';

export default function AuthLayout({ 
  slides, 
  children, 
  backgroundColor = "from-indigo-900 via-purple-900 to-blue-900",
  rightBgColor = "from-white to-blue-50",
  particleColors = {
    particle1: "purple",
    particle2: "blue",
    particle3: "cyan",
    particle4: "indigo",
    particle5: "purple"
  }
}) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const CurrentIcon = slides[currentSlide].icon;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${backgroundColor} flex items-center justify-center p-4 relative overflow-hidden`}>
      
      {/* Diagonal Wave Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Diagonal Wave 1 */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute w-full h-full animate-diagonal-wave-1">
            <div className={`absolute top-0 -left-1/4 w-full h-full bg-gradient-to-br from-${particleColors.particle1}-500 via-${particleColors.particle4}-500 to-transparent transform rotate-12 blur-3xl`}></div>
          </div>
        </div>
        
        {/* Diagonal Wave 2 */}
        <div className="absolute inset-0 opacity-25">
          <div className="absolute w-full h-full animate-diagonal-wave-2">
            <div className={`absolute -top-1/4 left-0 w-full h-full bg-gradient-to-br from-${particleColors.particle2}-400 via-${particleColors.particle3}-400 to-transparent transform -rotate-12 blur-3xl`}></div>
          </div>
        </div>
        
        {/* Diagonal Wave 3 */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute w-full h-full animate-diagonal-wave-3">
            <div className={`absolute top-1/4 -right-1/4 w-full h-full bg-gradient-to-bl from-${particleColors.particle4}-400 via-${particleColors.particle1}-400 to-transparent transform rotate-12 blur-3xl`}></div>
          </div>
        </div>
        
        {/* Diagonal Wave 4 */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute w-full h-full animate-diagonal-wave-4">
            <div className={`absolute bottom-0 left-1/4 w-full h-full bg-gradient-to-tr from-${particleColors.particle3}-500 via-${particleColors.particle2}-500 to-transparent transform -rotate-12 blur-3xl`}></div>
          </div>
        </div>
        
        {/* Wind Streaks - Diagonal flowing lines */}
        <div className="absolute inset-0 opacity-40">
          <div className={`absolute top-20 left-0 w-96 h-1 bg-gradient-to-r from-transparent via-${particleColors.particle1}-400 to-transparent transform -rotate-12 animate-wind-diagonal-1`}></div>
          <div className={`absolute top-32 left-0 w-80 h-1 bg-gradient-to-r from-transparent via-${particleColors.particle2}-400 to-transparent transform -rotate-12 animate-wind-diagonal-2`}></div>
          <div className={`absolute top-44 left-0 w-72 h-1 bg-gradient-to-r from-transparent via-${particleColors.particle3}-400 to-transparent transform -rotate-12 animate-wind-diagonal-3`}></div>
          
          <div className={`absolute top-1/2 left-0 w-96 h-1 bg-gradient-to-r from-transparent via-${particleColors.particle4}-400 to-transparent transform -rotate-12 animate-wind-diagonal-1`}></div>
          <div className={`absolute top-1/2 left-0 w-64 h-1 bg-gradient-to-r from-transparent via-${particleColors.particle1}-400 to-transparent transform -rotate-12 animate-wind-diagonal-4 mt-8`}></div>
          <div className={`absolute top-1/2 left-0 w-88 h-1 bg-gradient-to-r from-transparent via-${particleColors.particle2}-400 to-transparent transform -rotate-12 animate-wind-diagonal-2 mt-16`}></div>
          
          <div className={`absolute bottom-32 left-0 w-80 h-1 bg-gradient-to-r from-transparent via-${particleColors.particle3}-400 to-transparent transform -rotate-12 animate-wind-diagonal-3`}></div>
          <div className={`absolute bottom-20 left-0 w-96 h-1 bg-gradient-to-r from-transparent via-${particleColors.particle1}-400 to-transparent transform -rotate-12 animate-wind-diagonal-1`}></div>
          <div className={`absolute bottom-44 left-0 w-72 h-1 bg-gradient-to-r from-transparent via-${particleColors.particle4}-400 to-transparent transform -rotate-12 animate-wind-diagonal-4`}></div>
        </div>
        
        {/* Glowing particles */}
        <div className={`absolute top-1/4 left-1/4 w-3 h-3 bg-${particleColors.particle1}-400 rounded-full opacity-60 shadow-lg shadow-${particleColors.particle1}-500/50 animate-particle-float-1`}></div>
        <div className={`absolute top-1/3 right-1/3 w-4 h-4 bg-${particleColors.particle2}-400 rounded-full opacity-50 shadow-lg shadow-${particleColors.particle2}-500/50 animate-particle-float-2`}></div>
        <div className={`absolute bottom-1/3 left-1/3 w-3 h-3 bg-${particleColors.particle3}-400 rounded-full opacity-60 shadow-lg shadow-${particleColors.particle3}-500/50 animate-particle-float-3`}></div>
        <div className={`absolute top-2/3 right-1/4 w-3 h-3 bg-${particleColors.particle4}-400 rounded-full opacity-50 shadow-lg shadow-${particleColors.particle4}-500/50 animate-particle-float-4`}></div>
        <div className={`absolute top-1/2 left-1/2 w-4 h-4 bg-${particleColors.particle5}-300 rounded-full opacity-40 shadow-lg shadow-${particleColors.particle5}-500/50 animate-particle-float-1`}></div>
      </div>

      <div className="max-w-6xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10">
        
        {/* Left Side - Rotating Content */}
        <div className={`md:w-1/2 bg-gradient-to-br ${slides[currentSlide].gradient} p-12 flex flex-col justify-between relative overflow-hidden transition-all duration-700`}>
          {/* Animated Background Elements */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-white opacity-10 rounded-full -mr-36 -mt-36 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white opacity-10 rounded-full -ml-28 -mb-28 animate-pulse"></div>
          <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-white opacity-40 rounded-full animate-ping"></div>
          
          {/* Wind/Speed lines effect */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 right-0 w-32 h-0.5 bg-white animate-speed-line-1"></div>
            <div className="absolute top-1/3 right-0 w-24 h-0.5 bg-white animate-speed-line-2"></div>
            <div className="absolute top-2/5 right-0 w-28 h-0.5 bg-white animate-speed-line-3"></div>
            <div className="absolute top-1/2 right-0 w-20 h-0.5 bg-white animate-speed-line-1"></div>
            <div className="absolute top-3/5 right-0 w-26 h-0.5 bg-white animate-speed-line-2"></div>
            <div className="absolute top-2/3 right-0 w-24 h-0.5 bg-white animate-speed-line-3"></div>
          </div>
          
          {/* Brand Header */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Car className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <h1 className="text-white text-4xl font-bold">RideFlow</h1>
            </div>
            <p className="text-blue-100 text-sm ml-15">Your journey, your choice</p>
          </div>

          {/* Animated Content */}
          <div className="relative z-10 text-center transition-all duration-700 transform">
            <div className="mb-8 flex justify-center">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm p-12 rounded-3xl relative">
                <CurrentIcon className="w-40 h-40 text-white relative z-10" strokeWidth={1.5} />
                <div className="absolute inset-0 border-4 border-white border-opacity-30 rounded-3xl animate-spin-slow"></div>
              </div>
            </div>
            
            <h2 className="text-white text-3xl font-bold mb-4">
              {slides[currentSlide].title}
            </h2>
            <p className="text-blue-50 text-lg px-6 leading-relaxed">
              {slides[currentSlide].subtitle}
            </p>
          </div>

          {/* Slide Indicators */}
          <div className="flex justify-center gap-2 relative z-10">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  index === currentSlide 
                    ? 'w-10 bg-white shadow-lg' 
                    : 'w-2.5 bg-white bg-opacity-40 hover:bg-opacity-60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Right Side - Form Content */}
        <div className={`md:w-1/2 p-12 flex flex-col justify-center bg-gradient-to-br ${rightBgColor}`}>
          {children}
        </div>
      </div>
    </div>
  );
}