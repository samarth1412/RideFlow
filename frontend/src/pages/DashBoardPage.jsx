import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import axios from 'axios';
import { Car, Calendar, DollarSign, Mail, Phone, MapPin, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle, Wallet, ArrowUpRight, ArrowDownLeft, CreditCard, RefreshCw, Pencil, Save, Upload, FileCheck, FileX, Shield, User } from 'lucide-react';
import { formatUSD } from '../utils/money';

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [paymentSummaryBanner, setPaymentSummaryBanner] = useState(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeRentals: 0,
    totalSpent: 0,
    completedBookings: 0
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', city: '' });
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [citizenshipFile, setCitizenshipFile] = useState(null);
  const [uploadingCitizenship, setUploadingCitizenship] = useState(false);
  const [citizenshipError, setCitizenshipError] = useState('');
  const [citizenshipSuccess, setCitizenshipSuccess] = useState('');
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);
  const [profilePictureError, setProfilePictureError] = useState('');
  const [profilePictureSuccess, setProfilePictureSuccess] = useState('');

  // Fetch real bookings from API
  useEffect(() => {
    fetchBookings();
  }, []);

  // Fetch transactions and refresh user data when tab changes
  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions();
      // Refresh user balance when viewing transactions
      refreshUser().catch(err => console.error('Error refreshing user:', err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        city: user.city || ''
      });
    }
  }, [user]);

  // Sync tab with query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['overview', 'profile', 'transactions'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Handle payment summary passed via navigation state
  useEffect(() => {
    if (location.state?.paymentSummary) {
      setPaymentSummaryBanner(location.state.paymentSummary);
      setActiveTab('transactions');
      // Refresh user balance after payment
      refreshUser().catch(err => console.error('Error refreshing user:', err));
      navigate(location.pathname + location.search, { replace: true });
    }
  }, [location.state, navigate, location.pathname, location.search, refreshUser]);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/bookings/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userBookings = res.data.bookings || [];
      setBookings(userBookings);
      
      // Calculate stats
      const total = userBookings.length;
      const active = userBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING').length;
      const completed = userBookings.filter(b => b.status === 'COMPLETED').length;
      const totalSpent = userBookings
        .filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      
      setStats({
        totalBookings: total,
        activeRentals: active,
        totalSpent: totalSpent,
        completedBookings: completed
      });
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
      CONFIRMED: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-700', icon: XCircle },
      COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle },
      EXPIRED: { bg: 'bg-orange-100', text: 'text-orange-700', icon: AlertCircle }
    };
    const style = styles[status] || styles.PENDING;
    const Icon = style.icon;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${style.bg} ${style.text}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Transaction functions - fetches only from database
  const fetchTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/payment/user/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const serverTransactions = res.data.payments || [];
      setTransactions(serverTransactions);
    } catch (err) {
      console.error('Fetch transactions error:', err);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'ALL') return true;
    return t.type === filter;
  });

  const formatTransactionDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeIcon = (type) => {
    return type === 'DEBIT' 
      ? <ArrowUpRight className="w-5 h-5 text-red-500" />
      : <ArrowDownLeft className="w-5 h-5 text-green-500" />;
  };

  const getTypeColor = (type) => {
    return type === 'DEBIT' ? 'text-red-600' : 'text-green-600';
  };

  const calculateBalance = () => {
    const credits = transactions.filter(t => t.type === 'CREDIT' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0);
    const debits = transactions.filter(t => t.type === 'DEBIT' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0);
    return { credits, debits, net: credits - debits };
  };

  const handleProfileInputChange = (field, value) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  };

  const handleProfileCancel = () => {
    setProfileError('');
    setIsEditingProfile(false);
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        city: user.city || ''
      });
    }
  };

  const handleProfileSave = async () => {
    setProfileError('');
    setSavingProfile(true);
    try {
      const payload = {
        name: profileForm.name?.trim(),
        phone: profileForm.phone?.trim(),
        city: profileForm.city?.trim()
      };
      const res = await axios.patch('/api/auth/profile', payload);
      if (res.data?.user) {
        updateUser({
          name: res.data.user.name,
          phone: res.data.user.phone,
          city: res.data.user.city
        });
      }
      setIsEditingProfile(false);
    } catch (err) {
      console.error('Profile update error:', err);
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCitizenshipFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setCitizenshipError('File size must be less than 5MB');
        return;
      }
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setCitizenshipError('Only JPG and PNG image files are allowed');
        return;
      }
      setCitizenshipFile(file);
      setCitizenshipError('');
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setProfilePictureError('File size must be less than 5MB');
        return;
      }
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setProfilePictureError('Only JPG and PNG image files are allowed');
        return;
      }
      setProfilePictureError('');
      // Immediately upload when file is selected
      handleProfilePictureUpload(file);
    }
  };

  const handleProfilePictureUpload = async (file) => {
    setUploadingProfilePicture(true);
    setProfilePictureError('');
    setProfilePictureSuccess('');

    try {
      // Upload to Cloudinary first
      const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
      const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', 'profile_pictures');

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const cloudinaryData = await cloudinaryRes.json();

      if (cloudinaryData.error) {
        throw new Error(cloudinaryData.error.message);
      }

      const pictureUrl = cloudinaryData.secure_url;

      // Now send the URL to backend
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/auth/upload-profile-picture', 
        { pictureUrl },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setProfilePictureSuccess('Profile picture updated successfully!');
      
      // Update user context
      if (res.data?.user) {
        updateUser({
          picture: res.data.user.picture
        });
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setProfilePictureSuccess('');
      }, 3000);

    } catch (err) {
      console.error('Profile picture upload error:', err);
      setProfilePictureError(err.response?.data?.message || err.message || 'Failed to upload profile picture');
    } finally {
      setUploadingProfilePicture(false);
    }
  };

  const handleCitizenshipUpload = async () => {
    if (!citizenshipFile) {
      setCitizenshipError('Please select a file first');
      return;
    }

    setUploadingCitizenship(true);
    setCitizenshipError('');
    setCitizenshipSuccess('');

    try {
      // Upload to Cloudinary first
      const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
      const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

      const formData = new FormData();
      formData.append('file', citizenshipFile);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', 'citizenship_documents');

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const cloudinaryData = await cloudinaryRes.json();

      if (cloudinaryData.error) {
        throw new Error(cloudinaryData.error.message);
      }

      const citizenshipUrl = cloudinaryData.secure_url;

      // Now send the URL to backend
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/auth/upload-citizenship', 
        { citizenshipUrl },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setCitizenshipSuccess('Citizenship document uploaded successfully! Awaiting admin verification.');
      setCitizenshipFile(null);
      
      // Update user context
      if (res.data?.user) {
        updateUser({
          citizenshipPhoto: res.data.user.citizenshipPhoto,
          verificationStatus: res.data.user.verificationStatus,
          isVerified: res.data.user.isVerified
        });
      }

      // Refresh user data
      const userRes = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (userRes.data?.user) {
        updateUser(userRes.data.user);
      }

    } catch (err) {
      console.error('Citizenship upload error:', err);
      setCitizenshipError(err.response?.data?.message || err.message || 'Failed to upload citizenship document');
    } finally {
      setUploadingCitizenship(false);
    }
  };

  const statsData = [
    { icon: Wallet, label: 'Wallet Balance', value: formatUSD(user?.walletBalance ?? 1000), color: 'indigo' },
    { icon: Car, label: 'Total Bookings', value: stats.totalBookings, color: 'blue' },
    { icon: Calendar, label: 'Active Rentals', value: stats.activeRentals, color: 'green' },
    { icon: DollarSign, label: 'Total Spent', value: formatUSD(stats.totalSpent), color: 'purple' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Picture */}
            <div className="relative group">
              <img
                src={user?.picture}
                alt={user?.name}
                className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover"
              />
              {/* Upload overlay with camera icon */}
              <label 
                htmlFor="profile-picture-input"
                className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ${
                  uploadingProfilePicture ? 'opacity-100' : ''
                }`}
              >
                {uploadingProfilePicture ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-3 border-white border-t-transparent"></div>
                ) : (
                  <Upload className="w-8 h-8 text-white" />
                )}
              </label>
              <input
                id="profile-picture-input"
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleProfilePictureChange}
                disabled={uploadingProfilePicture}
                className="hidden"
              />
              {/* Last updated indicator */}
              {user?.profilePictureUpdatedAt && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                  Custom
                </div>
              )}
            </div>
            
            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-3">{user?.name}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-blue-100">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </span>
                {user?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {user?.phone}
                  </span>
                )}
                {user?.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {user?.city}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Picture Upload Feedback */}
        {profilePictureError && (
          <div className="max-w-7xl mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{profilePictureError}</p>
            </div>
          </div>
        )}
        {profilePictureSuccess && (
          <div className="max-w-7xl mx-auto mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700">{profilePictureSuccess}</p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Overview', icon: Car },
            { id: 'profile', label: 'Profile Info', icon: Mail },
            { id: 'transactions', label: 'Transactions', icon: Wallet }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statsData.map((stat, index) => (
                <div 
                  key={index} 
                  className={`bg-white rounded-xl shadow-md p-6 transition-all ${
                    index === 0 ? 'hover:shadow-xl cursor-pointer hover:scale-105' : 'hover:shadow-lg'
                  }`}
                  onClick={index === 0 ? () => setActiveTab('transactions') : undefined}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      {index === 0 && (
                        <p className="text-xs text-blue-600 mt-1">Click to view transactions</p>
                      )}
                    </div>
                    <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Bookings</h2>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8">
                  <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No bookings yet</p>
                  <button
                    onClick={() => navigate('/vehicles')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Vehicles
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.slice(0, 5).map((booking) => (
                    <div key={booking._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                          {booking.vehicle?.image && (
                            <img
                              src={booking.vehicle.image}
                              alt={booking.vehicle?.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <h3 className="font-bold text-gray-900">{booking.vehicle?.name || 'Vehicle'}</h3>
                            <p className="text-gray-600 text-sm">
                              {formatDate(booking.pickupDate)} - {formatDate(booking.dropoffDate)}
                            </p>
                            <p className="text-blue-600 font-bold mt-1">{formatUSD(booking.totalPrice)}</p>
                          </div>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {bookings.length > 0 && (
                <button
                  onClick={() => navigate('/bookings')}
                  className="w-full mt-4 px-4 py-3 border-2 border-blue-600 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  View All Bookings
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
              {!isEditingProfile ? (
                <button
                  onClick={() => {
                    setProfileError('');
                    setIsEditingProfile(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleProfileSave}
                    disabled={savingProfile}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    {savingProfile ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleProfileCancel}
                    disabled={savingProfile}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {profileError && (
              <div className="mb-4 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {profileError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => handleProfileInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{user?.name || '-'}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{user?.email || '-'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                {isEditingProfile ? (
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => handleProfileInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. +977-9800000000"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{user?.phone || 'Not provided'}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={profileForm.city}
                    onChange={(e) => handleProfileInputChange('city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your city"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{user?.city || 'Not provided'}</div>
                )}
              </div>
            </div>

            {/* Profile Picture Section */}
            <div className="mt-8 bg-white rounded-xl shadow-md p-6 border-2 border-purple-100">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Profile Picture</h2>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="relative group">
                  <img
                    src={user?.picture}
                    alt="Profile"
                    className="w-32 h-32 rounded-full border-4 border-purple-200 shadow-lg object-cover"
                  />
                  <label 
                    htmlFor="profile-picture-input-settings"
                    className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ${
                      uploadingProfilePicture ? 'opacity-100' : ''
                    }`}
                  >
                    {uploadingProfilePicture ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-3 border-white border-t-transparent"></div>
                    ) : (
                      <Upload className="w-8 h-8 text-white" />
                    )}
                  </label>
                  <input
                    id="profile-picture-input-settings"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleProfilePictureChange}
                    disabled={uploadingProfilePicture}
                    className="hidden"
                  />
                </div>

                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-3">
                    Upload a custom profile picture. Maximum size: 5MB. Supported formats: JPG, PNG.
                  </p>
                  
                  {user?.profilePictureUpdatedAt && (
                    <div className="mb-3 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm text-purple-800">
                        <strong>Custom picture uploaded:</strong> {new Date(user.profilePictureUpdatedAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}

                  {user?.originalPicture && user?.profilePictureUpdatedAt && (
                    <button
                      onClick={async () => {
                        if (window.confirm('Revert to your original Google profile picture?')) {
                          try {
                            const token = localStorage.getItem('token');
                            const res = await axios.post('/api/auth/upload-profile-picture',
                              { pictureUrl: user.originalPicture },
                              { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
                            );
                            if (res.data?.user) {
                              updateUser({ 
                                picture: res.data.user.picture,
                                profilePictureUpdatedAt: null 
                              });
                              setProfilePictureSuccess('Profile picture reverted to original');
                              setTimeout(() => setProfilePictureSuccess(''), 3000);
                            }
                          } catch (err) {
                            setProfilePictureError('Failed to revert profile picture');
                          }
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-300 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Revert to Original Google Picture
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Citizenship Verification Section */}
            <div className="mt-8 bg-white rounded-xl shadow-md p-6 border-2 border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Account Verification</h2>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Upload your citizenship document to verify your account. Verification is required to book vehicles or become a host.
              </p>

              {/* Verification Status Badge */}
              <div className="mb-6">
                {user?.verificationStatus === 'NOT_SUBMITTED' && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-semibold text-yellow-800">Verification Pending</p>
                      <p className="text-sm text-yellow-700">Please upload your citizenship document below</p>
                    </div>
                  </div>
                )}

                {user?.verificationStatus === 'PENDING' && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-800">Under Review</p>
                      <p className="text-sm text-blue-700">Your document is being verified by our admin team</p>
                    </div>
                  </div>
                )}

                {user?.verificationStatus === 'APPROVED' && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                    <FileCheck className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800">Verified ✓</p>
                      <p className="text-sm text-green-700">Your account has been successfully verified</p>
                      {user?.verificationDate && (
                        <p className="text-xs text-green-600 mt-1">
                          Verified on {new Date(user.verificationDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {user?.verificationStatus === 'REJECTED' && (
                  <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileX className="w-5 h-5 text-red-600" />
                      <p className="font-semibold text-red-800">Verification Rejected</p>
                    </div>
                    {user?.rejectionReason && (
                      <p className="text-sm text-red-700 ml-7">Reason: {user.rejectionReason}</p>
                    )}
                    <p className="text-sm text-red-600 ml-7 mt-1">Please upload a clear document again</p>
                  </div>
                )}
              </div>

              {/* Upload Form - Show only if not approved */}
              {user?.verificationStatus !== 'APPROVED' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Citizenship Document (JPG, PNG - Max 5MB)
                  </label>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleCitizenshipFileChange}
                        disabled={uploadingCitizenship}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                      />
                      {citizenshipFile && (
                        <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Selected: {citizenshipFile.name}
                        </p>
                      )}
                    </div>
                    
                    <button
                      onClick={handleCitizenshipUpload}
                      disabled={!citizenshipFile || uploadingCitizenship}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {uploadingCitizenship ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload
                        </>
                      )}
                    </button>
                  </div>

                  {citizenshipError && (
                    <div className="mt-3 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      {citizenshipError}
                    </div>
                  )}

                  {citizenshipSuccess && (
                    <div className="mt-3 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                      {citizenshipSuccess}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <>
            {paymentSummaryBanner && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-semibold uppercase tracking-wide">Latest Payment</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">Payment Successful</h3>
                    <p className="text-sm text-gray-600 mt-1">We credited the owner and recorded this transaction.</p>
                  </div>
                  <button onClick={() => setPaymentSummaryBanner(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-5 text-sm">
                  <div>
                    <p className="text-gray-500">Transaction ID</p>
                    <p className="font-mono text-gray-900 text-sm break-all">{paymentSummaryBanner.transactionId}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="text-green-700 font-semibold">{formatUSD(paymentSummaryBanner.amount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Method</p>
                    <p className="font-semibold text-gray-900">{paymentSummaryBanner.method}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Paid To</p>
                    <p className="font-semibold text-gray-900">{paymentSummaryBanner.ownerName}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Balance Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                <Wallet className="w-8 h-8 mb-3 opacity-90" />
                <p className="text-sm opacity-90 mb-1">Current Balance</p>
                <p className="text-3xl font-bold">{formatUSD(user?.walletBalance ?? 1000)}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ArrowDownLeft className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">Total Received</p>
                </div>
                <p className="text-2xl font-bold text-green-600">+{formatUSD(calculateBalance().credits)}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-6 border border-red-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <ArrowUpRight className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-sm text-gray-600">Total Paid</p>
                </div>
                <p className="text-2xl font-bold text-red-600">-{formatUSD(calculateBalance().debits)}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Wallet className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600">Net Flow</p>
                </div>
                <p className={`text-2xl font-bold ${calculateBalance().net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {calculateBalance().net >= 0 ? '+' : '-'}{formatUSD(Math.abs(calculateBalance().net))}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('ALL')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'ALL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Transactions
                </button>
                <button
                  onClick={() => setFilter('DEBIT')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'DEBIT'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Payments Made
                </button>
                <button
                  onClick={() => setFilter('CREDIT')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'CREDIT'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Payments Received
                </button>
              </div>

              <button
                onClick={fetchTransactions}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {/* Transactions List */}
            {transactionsLoading ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Transactions Yet</h3>
                <p className="text-gray-500 mb-6">Your payment history will appear here</p>
                <button
                  onClick={() => navigate('/vehicles')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse Vehicles
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {filteredTransactions.map((transaction) => (
                    <div
                      key={transaction._id}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        {/* Left Side - Transaction Details */}
                        <div className="flex items-start gap-4 flex-1">
                          {/* Icon */}
                          <div className={`p-3 rounded-full ${
                            transaction.type === 'DEBIT' ? 'bg-red-50' : 'bg-green-50'
                          }`}>
                            {getTypeIcon(transaction.type)}
                          </div>

                          {/* Details */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-gray-900">
                                {transaction.description}
                              </h3>
                              {transaction.status === 'COMPLETED' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                  <CheckCircle className="w-3 h-3" />
                                  Completed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                  <XCircle className="w-3 h-3" />
                                  Failed
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatTransactionDate(transaction.date)}
                              </div>
                              <div className="flex items-center gap-1">
                                <CreditCard className="w-4 h-4" />
                                {transaction.paymentMethod}
                              </div>
                              <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                {transaction.transactionId}
                              </div>
                            </div>

                            {/* Other Party */}
                            <div className="flex items-center gap-2 mt-3">
                              {transaction.otherParty?.picture ? (
                                <img
                                  src={transaction.otherParty.picture}
                                  alt={transaction.otherParty?.name || 'User avatar'}
                                  className="w-6 h-6 rounded-full"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                                  ?
                                </div>
                              )}
                              <span className="text-sm text-gray-600">
                                {transaction.type === 'DEBIT' ? 'To:' : 'From:'} {transaction.otherParty?.name || 'Unknown User'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right Side - Amount */}
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${getTypeColor(transaction.type)}`}>
                            {transaction.type === 'DEBIT' ? '-' : '+'}{formatUSD(transaction.amount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}