import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import axios from 'axios';
import { Shield, Clock, CheckCircle, XCircle, Mail, Phone, MapPin } from 'lucide-react';

export default function AdminVerificationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingUserId, setProcessingUserId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== 'admin') {
      navigate('/home');
      return;
    }
    fetchPendingUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const fetchPendingUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/auth/pending-verifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingUsers(res.data.users || []);
    } catch (err) {
      console.error('Error fetching pending users:', err);
      if (err.response?.status === 403) {
        navigate('/home');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    if (!window.confirm('Are you sure you want to approve this user?')) return;

    setProcessingUserId(userId);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `/api/auth/verify-user/${userId}`,
        { action: 'APPROVE' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('User approved successfully!');
      fetchPendingUsers();
    } catch (err) {
      console.error('Error approving user:', err);
      alert(err.response?.data?.message || 'Failed to approve user');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm('Are you sure you want to reject this user verification?')) return;

    setProcessingUserId(userId);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `/api/auth/verify-user/${userId}`,
        { action: 'REJECT' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('User verification rejected');
      fetchPendingUsers();
    } catch (err) {
      console.error('Error rejecting user:', err);
      alert(err.response?.data?.message || 'Failed to reject user');
    } finally {
      setProcessingUserId(null);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl shadow-xl p-6 mb-8 text-white">
          <div className="flex items-center gap-4">
            <Shield className="w-12 h-12" />
            <div>
              <h1 className="text-3xl font-bold">Admin Verification Panel</h1>
              <p className="text-purple-100 mt-1">Review and verify user citizenship documents</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Pending Verifications</p>
                <p className="text-3xl font-bold text-gray-900">{pendingUsers.length}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Pending Users List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading pending verifications...</p>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">All Caught Up!</h3>
            <p className="text-gray-500">No pending verifications at the moment</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingUsers.map((pendingUser) => (
              <div key={pendingUser._id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{pendingUser.name}</h3>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="w-4 h-4" />
                              <span className="text-sm">{pendingUser.email}</span>
                            </div>
                            {pendingUser.phone && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Phone className="w-4 h-4" />
                                <span className="text-sm">{pendingUser.phone}</span>
                              </div>
                            )}
                            {pendingUser.city && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm">{pendingUser.city}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Pending
                        </span>
                      </div>

                      <div className="text-xs text-gray-500 mb-4">
                        Submitted: {new Date(pendingUser.createdAt).toLocaleDateString()}
                      </div>

                      {/* Citizenship Document Preview */}
                      {pendingUser.citizenshipPhoto && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Citizenship Document
                          </label>
                          <div className="relative group">
                            <div>
                              <img
                                src={pendingUser.citizenshipPhoto}
                                alt="Citizenship"
                                className="w-full max-w-md rounded-lg border-2 border-gray-300 cursor-pointer hover:border-blue-500 transition-colors"
                                onClick={() => setSelectedImage(pendingUser.citizenshipPhoto)}
                              />
                              <p className="text-xs text-gray-500 mt-2">Click to view full size</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 mt-6">
                        <button
                          onClick={() => handleApprove(pendingUser._id)}
                          disabled={processingUserId === pendingUser._id}
                          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {processingUserId === pendingUser._id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-5 h-5" />
                              Approve
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleReject(pendingUser._id)}
                          disabled={processingUserId === pendingUser._id}
                          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          <XCircle className="w-5 h-5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Citizenship Full Size"
              className="max-w-full max-h-screen rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-200"
            >
              <XCircle className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
