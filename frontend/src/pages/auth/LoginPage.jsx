import React, { useState } from 'react';
import { Car, Bike, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AuthLayout from '../../components/auth/AuthLayout';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';
import { useAuth } from '../../context/AuthContext';
import TermsOfService from '../../components/common/TermsOfService';
import PrivacyPolicy from '../../components/common/PrivacyPolicy';
import Modal from '../../components/common/Modal';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const slides = [
    {
      title: "Ride Anywhere",
      subtitle: "Find the perfect vehicle for any journey",
      icon: Car,
      gradient: "from-blue-500 to-cyan-400"
    },
    {
      title: "Rent Your Dream Ride",
      subtitle: "Choose from thousands of vehicles across the country",
      icon: Truck,
      gradient: "from-blue-600 to-indigo-500"
    },
    {
      title: "List Your Vehicle",
      subtitle: "Earn money by sharing your vehicles when you're not using it",
      icon: Bike,
      gradient: "from-cyan-500 to-blue-500"
    }
  ];

  const handleGoogleLogin = (response) => {
    console.log('Login Response:', response);

    // Save user and token
    login(response.user, response.token);

    // Redirect based on profile completion
    if (response.isNewUser || !response.user.isProfileComplete) {
      navigate('/register-details');
    } else {
      navigate('/home');
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
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
        <div className="flex flex-col justify-center px-6 py-8">
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Welcome Back</h2>
            <p className="text-gray-600 text-lg">Sign in to continue your journey</p>
          </div>

          <GoogleLoginButton onGoogleLogin={handleGoogleLogin} />

          <p className="mt-8 text-center text-sm text-gray-500">
            By continuing, you agree to our{' '}
            <button
              onClick={() => setShowTerms(true)}
              className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
            >
              Terms of Service
            </button>{' '}
            and{' '}
            <button
              onClick={() => setShowPrivacy(true)}
              className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
            >
              Privacy Policy
            </button>
          </p>

          {showTerms && (
            <Modal title="Terms of Service" onClose={() => setShowTerms(false)}>
              <TermsOfService />
            </Modal>
          )}

          {showPrivacy && (
            <Modal title="Privacy Policy" onClose={() => setShowPrivacy(false)}>
              <PrivacyPolicy />
            </Modal>
          )}
        </div>
      </AuthLayout>
    </GoogleOAuthProvider>
  );
}