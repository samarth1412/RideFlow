import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Car, Menu, X, User, LogOut, Bell, Calendar, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const notificationRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch rental requests (for hosts)
      const ownerRes = await axios.get('/api/bookings/owner', {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: { bookings: [] } }));
      
      // Fetch user's bookings (for status updates)
      const userRes = await axios.get('/api/bookings/user', {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: { bookings: [] } }));

      const allNotifications = [];
      
      // Add pending rental requests (for hosts)
      const pendingRequests = ownerRes.data.bookings?.filter(b => b.status === 'PENDING') || [];
      pendingRequests.forEach(booking => {
        allNotifications.push({
          id: `request-${booking._id}`,
          type: 'rental_request',
          title: 'New Rental Request',
          message: `${booking.user?.name || 'Someone'} wants to rent your ${booking.vehicle?.name || 'vehicle'}`,
          time: new Date(booking.createdAt),
          read: false,
          link: '/rental-requests',
          icon: 'calendar'
        });
      });

      // Add booking status updates (for renters)
      const recentBookings = userRes.data.bookings?.filter(b => {
        const updatedAt = new Date(b.updatedAt);
        const hourAgo = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
        return updatedAt > hourAgo && (b.status === 'CONFIRMED' || b.status === 'REJECTED');
      }) || [];
      
      recentBookings.forEach(booking => {
        if (booking.status === 'CONFIRMED') {
          allNotifications.push({
            id: `confirmed-${booking._id}`,
            type: 'booking_confirmed',
            title: 'Booking Confirmed!',
            message: `Your booking for ${booking.vehicle?.name || 'vehicle'} has been approved`,
            time: new Date(booking.updatedAt),
            read: false,
            link: '/my-bookings',
            icon: 'check'
          });
        } else if (booking.status === 'REJECTED') {
          allNotifications.push({
            id: `rejected-${booking._id}`,
            type: 'booking_rejected',
            title: 'Booking Rejected',
            message: `Your booking for ${booking.vehicle?.name || 'vehicle'} was declined`,
            time: new Date(booking.updatedAt),
            read: false,
            link: '/my-bookings',
            icon: 'x'
          });
        }
      });

      // Sort by time (newest first)
      allNotifications.sort((a, b) => b.time - a.time);
      
      setNotifications(allNotifications);
      setUnreadCount(allNotifications.length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications on mount and periodically
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getNotificationIcon = (iconType) => {
    switch (iconType) {
      case 'calendar':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'check':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'x':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'clock':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification) => {
    setNotificationOpen(false);
    navigate(notification.link);
  };

  const navLinks = [
    { name: 'Home', path: '/home' },
    { name: 'Vehicles', path: '/vehicles' },
    { name: 'My Bookings', path: '/my-bookings' },
    { name: 'Become a Host', path: '/become-host'}
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/home" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">RideFlow</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-base font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {/* Notification Bell */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => {
                      setNotificationOpen(!notificationOpen);
                      setUserMenuOpen(false);
                    }}
                    className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Bell className="w-6 h-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {notificationOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                      <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        <h3 className="font-semibold">Notifications</h3>
                        <p className="text-xs text-blue-100">{unreadCount} new notifications</p>
                      </div>
                      
                      <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                            Loading...
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                            <p>No new notifications</p>
                          </div>
                        ) : (
                          notifications.slice(0, 5).map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 flex items-start gap-3"
                            >
                              <div className="flex-shrink-0 mt-1">
                                {getNotificationIcon(notification.icon)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {getTimeAgo(notification.time)}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {notifications.length > 0 && (
                        <div className="px-4 py-2 bg-gray-50 border-t">
                          <button
                            onClick={() => {
                              setNotificationOpen(false);
                              navigate('/rental-requests');
                            }}
                            className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View All Notifications
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User Profile */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setUserMenuOpen(!userMenuOpen);
                      setNotificationOpen(false);
                    }}
                    className="flex items-center space-x-2 focus:outline-none"
                  >
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-10 h-10 rounded-full border-2 border-blue-500"
                    />
                    <span className="text-gray-700 font-medium">{user.name?.split(' ')[0]}</span>
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50">
                      <Link
                        to="/dashboard"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        My Profile
                      </Link>
                      <Link
                        to="/rental-requests"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Bell className="w-4 h-4 mr-2" />
                        Rental Requests
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Notification Bell */}
            {user && (
              <button
                onClick={() => navigate('/rental-requests')}
                className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-4 py-2 rounded-lg ${
                  isActive(link.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {user && (
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}