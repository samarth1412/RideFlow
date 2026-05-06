import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Settings, ArrowLeft, Bell } from "lucide-react";
import Navbar from "../../components/common/Navbar";

export default function BecomeHostPage() {
  const navigate = useNavigate();

  const options = [
    {
      id: 1,
      title: "Add Vehicle",
      description: "List a new vehicle for rent and start earning",
      icon: Plus,
      color: "from-blue-500 to-indigo-600",
      hoverColor: "hover:from-blue-600 hover:to-indigo-700",
      bgIcon: "bg-blue-100",
      iconColor: "text-blue-600",
      onClick: () => navigate("/add-vehicle")
    },
    {
      id: 2,
      title: "Manage My Vehicles",
      description: "View, edit, and control your listed vehicles",
      icon: Settings,
      color: "from-emerald-500 to-teal-600",
      hoverColor: "hover:from-emerald-600 hover:to-teal-700",
      bgIcon: "bg-emerald-100",
      iconColor: "text-emerald-600",
      onClick: () => navigate("/manage-vehicles")
    },
    {
      id: 3,
      title: "Rental Requests",
      description: "View and respond to booking requests from renters",
      icon: Bell,
      color: "from-orange-500 to-amber-600",
      hoverColor: "hover:from-orange-600 hover:to-amber-700",
      bgIcon: "bg-orange-100",
      iconColor: "text-orange-600",
      onClick: () => navigate("/rental-requests")
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar />
      <div className="p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 bg-white text-gray-700 rounded-lg shadow hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Become a Host</h1>
            <p className="text-gray-600 mt-1">Share your vehicle and earn money</p>
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {options.map((option) => (
            <div
              key={option.id}
              onClick={option.onClick}
              className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform hover:scale-[1.02] transition-all duration-300 hover:shadow-xl"
            >
              {/* Card Header with Gradient */}
              <div className={`bg-gradient-to-r ${option.color} ${option.hoverColor} p-6 transition-all duration-300`}>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                  <option.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">{option.title}</h3>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <p className="text-gray-600 mb-4">{option.description}</p>
                <div className="flex items-center text-sm font-semibold text-gray-800">
                  <span>Get Started</span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
