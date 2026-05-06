import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/common/Navbar';
import { Wallet, ArrowUpRight, ArrowDownLeft, Calendar, CreditCard, CheckCircle, XCircle, Loader, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatUSD } from '../utils/money';

export default function TransactionHistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, DEBIT, CREDIT
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/payment/user/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data.payments || []);
    } catch (err) {
      console.error('Fetch transactions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      setClearing(true);
      const token = localStorage.getItem('token');
      await axios.delete('/api/payment/user/clear-history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions([]);
      setShowClearConfirm(false);
      alert('Transaction history cleared successfully!');
    } catch (err) {
      console.error('Clear history error:', err);
      alert('Failed to clear transaction history');
    } finally {
      setClearing(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'ALL') return true;
    return t.type === filter;
  });

  const formatDate = (dateString) => {
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

  const balance = calculateBalance();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with Balance Card */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Transaction History</h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Current Balance */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
              <Wallet className="w-8 h-8 mb-3 opacity-90" />
              <p className="text-sm opacity-90 mb-1">Current Balance</p>
              <p className="text-3xl font-bold">{formatUSD(user?.walletBalance || 0)}</p>
            </div>

            {/* Total Received */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ArrowDownLeft className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">Total Received</p>
              </div>
              <p className="text-2xl font-bold text-green-600">+{formatUSD(balance.credits)}</p>
            </div>

            {/* Total Paid */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-red-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ArrowUpRight className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-sm text-gray-600">Total Paid</p>
              </div>
              <p className="text-2xl font-bold text-red-600">-{formatUSD(balance.debits)}</p>
            </div>

            {/* Net */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Wallet className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">Net Flow</p>
              </div>
              <p className={`text-2xl font-bold ${balance.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {balance.net >= 0 ? '+' : '-'}{formatUSD(Math.abs(balance.net))}
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
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

          <div className="flex gap-2">
            <button
              onClick={fetchTransactions}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            
            {transactions.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear History
              </button>
            )}
          </div>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
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
                            {formatDate(transaction.date)}
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
                          <img
                            src={transaction.otherParty.picture}
                            alt={transaction.otherParty.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm text-gray-600">
                            {transaction.type === 'DEBIT' ? 'To:' : 'From:'} {transaction.otherParty.name}
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
      </div>

      {/* Clear History Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Clear Transaction History?</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              This will permanently delete all your transaction records. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={clearing}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={clearHistory}
                disabled={clearing}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {clearing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Clear History
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
