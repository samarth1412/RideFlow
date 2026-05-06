import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

export default function GoogleLoginButton({ onGoogleLogin }) {
  const handleSuccess = async (credentialResponse) => {
    try {
      console.log('🔵 Google Login Success');
      
      // Decode Google JWT token
      const decoded = jwtDecode(credentialResponse.credential);
      console.log('Google User Data:', decoded);

      // Send to backend
      const response = await axios.post('/api/auth/google-login', {
        googleId: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture
      });

      console.log('Backend Response:', response.data);
      
      // Call parent callback
      onGoogleLogin(response.data);
    } catch (error) {
      console.error('Google login error:', error);
      alert('Login failed. Please try again.');
    }
  };

  const handleError = () => {
    console.error('❌ Google Login Failed');
    alert('Google login failed. Please try again.');
  };

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
        logo_alignment="left"
      />
    </div>
  );
}