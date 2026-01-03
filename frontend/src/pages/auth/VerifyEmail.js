import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { authAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error, resend
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('resend');
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      setStatus('verifying');
      const response = await authAPI.verifyEmail(token);
      setStatus('success');
      setMessage(response.data.message || 'Email verified successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Verification failed. The link may have expired.');
    }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsResending(true);
      await authAPI.resendVerification(email);
      setMessage('Verification email sent! Please check your inbox.');
      setStatus('success');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to send verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-indigo-600">Dayflow</h1>
          <p className="text-gray-500 mt-1">Every workday, perfectly aligned</p>
        </div>

        {/* Verifying State */}
        {status === 'verifying' && (
          <div className="text-center py-8">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 mt-4">Verifying your email...</p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center py-8">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-semibold text-gray-900 mt-4">Email Verified!</h2>
            <p className="text-gray-600 mt-2">{message}</p>
            <p className="text-gray-500 mt-4 text-sm">Redirecting to login...</p>
            <Link
              to="/login"
              className="mt-6 inline-block text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Go to Login Now
            </Link>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center py-8">
            <XCircleIcon className="h-16 w-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-semibold text-gray-900 mt-4">Verification Failed</h2>
            <p className="text-gray-600 mt-2">{message}</p>
            
            <div className="mt-6 space-y-4">
              <button
                onClick={() => setStatus('resend')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Request New Verification Link
              </button>
              <Link
                to="/login"
                className="block text-center text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}

        {/* Resend Verification Form */}
        {status === 'resend' && (
          <div className="py-4">
            <div className="text-center mb-6">
              <EnvelopeIcon className="h-16 w-16 text-indigo-500 mx-auto" />
              <h2 className="text-2xl font-semibold text-gray-900 mt-4">Resend Verification Email</h2>
              <p className="text-gray-600 mt-2">
                Enter your email address to receive a new verification link.
              </p>
            </div>

            <form onSubmit={handleResendVerification} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your email"
                />
              </div>

              {message && (
                <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={isResending}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
              >
                {isResending ? <LoadingSpinner size="sm" color="white" /> : 'Send Verification Email'}
              </button>
            </form>

            <Link
              to="/login"
              className="mt-4 block text-center text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
