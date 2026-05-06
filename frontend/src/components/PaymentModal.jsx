// frontend/src/components/PaymentModal.jsx - CLEANED VERSION
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CreditCard, Banknote, CheckCircle, XCircle, Loader, MapPin, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../config/api';
import { formatUSD } from '../utils/money';

const PaymentModal = ({ booking, isOpen, onClose, onPaymentSuccess }) => {
  const navigate = useNavigate();
  const { user, updateUser, refreshUser } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState('demo-wallet');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const calculateFareBreakdown = () => {
    const totalPrice = booking.totalPrice || 0;
    const baseFare = Math.floor(totalPrice * 0.7);
    const distanceFare = Math.floor(totalPrice * 0.2);
    const serviceFee = totalPrice - baseFare - distanceFare;

    return {
      baseFare,
      distanceFare,
      serviceFee,
      total: totalPrice
    };
  };

  const fareBreakdown = calculateFareBreakdown();

  const handlePayment = async () => {
    setIsProcessing(true);
    setErrorMessage('');

      const totalAmount = booking.totalPrice || fareBreakdown.total || 0;
    const paymentMethodLabel = selectedMethod === 'demo-wallet' ? 'Demo Wallet' : 'Cash';

    try {
      // Call backend API to process payment
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/payment/demo'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId: booking._id,
          paymentMethod: paymentMethodLabel,
          amount: totalAmount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.currentBalance !== undefined && data.required !== undefined) {
          throw new Error(`Insufficient balance. You have ${formatUSD(data.currentBalance)} but need ${formatUSD(data.required)}`);
        }
        throw new Error(data.message || 'Payment failed');
      }

      // Update local wallet balance from backend response
      if (selectedMethod === 'demo-wallet' && data.newBalance !== undefined) {
        updateUser({ walletBalance: data.newBalance });
      } else if (selectedMethod === 'demo-wallet') {
        // Fallback: refresh full user data from server
        await refreshUser();
      }

      setPaymentStatus('success');

      // Auto-redirect after 1.5 seconds
      setTimeout(() => {
        const payload = {
          bookingId: booking._id,
          transactionId: data.transactionId,
          amount: totalAmount,
          paymentMethod: paymentMethodLabel,
          date: data.completedAt
        };
        onPaymentSuccess(payload);
        onClose();
        setPaymentStatus(null);
        navigate('/home?tab=transactions');
      }, 1500);
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage(error.message || 'Something went wrong while processing the payment.');
      setPaymentStatus('failed');
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setPaymentStatus(null);
    setIsProcessing(false);
  };

  const paymentMethods = [
    { id: 'demo-wallet', label: 'Demo Wallet', icon: CreditCard, description: 'Pay using demo wallet balance' },
    { id: 'cash', label: 'Cash', icon: Banknote, description: 'Pay with cash on pickup' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Success State */}
        {paymentStatus === 'success' && (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">
              Your payment of {formatUSD(fareBreakdown.total)} has been processed successfully
            </p>
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <Loader className="w-4 h-4 animate-spin" />
              Redirecting to transactions...
            </div>
          </div>
        )}

        {/* Failed State */}
        {paymentStatus === 'failed' && (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-red-600 mb-6">{errorMessage}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Payment Form */}
        {!paymentStatus && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Complete Payment</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Booking Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 mb-3">Booking Details</h3>
                
                <div className="flex items-start gap-4">
                  <img
                    src={booking.vehicle?.image || '/placeholder-car.jpg'}
                    alt={booking.vehicle?.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{booking.vehicle?.name}</h4>
                    <p className="text-sm text-gray-600">{booking.vehicle?.model}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{booking.totalDays} days</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{booking.pickupLocation}</span>
                  </div>
                </div>
              </div>

              {/* Total Amount */}
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total Amount</span>
                    <span className="text-2xl font-bold text-blue-600">{formatUSD(fareBreakdown.total)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Payment Method</h3>
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                        selectedMethod === method.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <method.icon className={`w-6 h-6 ${
                        selectedMethod === method.id ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">{method.label}</p>
                        <p className="text-sm text-gray-500">{method.description}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 ${
                        selectedMethod === method.id
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300'
                      } flex items-center justify-center`}>
                        {selectedMethod === method.id && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallet Balance Info */}
              {selectedMethod === 'demo-wallet' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Current Wallet Balance</p>
                      <p className="text-lg font-bold text-blue-600">{formatUSD(user?.walletBalance ?? 1000)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Owner Information */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Payment To</h3>
                <div className="flex items-center gap-3">
                  <img
                    src={booking.owner?.picture || '/default-avatar.png'}
                    alt={booking.owner?.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{booking.owner?.name}</p>
                    <p className="text-sm text-gray-600">Vehicle Owner</p>
                  </div>
                </div>
              </div>

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pay {formatUSD(fareBreakdown.total)}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;