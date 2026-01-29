import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [twoFARequired, setTwoFARequired] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');

  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Stop propagation just in case
    console.log("Form submitted. IsLogin:", isLogin, "2FA Required:", twoFARequired); // DEBUG

    setError('');
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password, twoFACode);

        if (result && result.requires2FA) {
          setTwoFARequired(true);
          setLoading(false);
          return;
        }
      } else {
        result = await register(
          formData.email,
          formData.password,
          formData.firstName,
          formData.lastName
        );
        if (result.success) {
          setIsLogin(true);
          setFormData({ email: '', password: '', firstName: '', lastName: '' });
          alert('Account created successfully! Please sign in.');
        }
      }

      if (!result.success && !result.requires2FA) {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      // Only stop loading if we are NOT waiting for 2FA input
      if (!twoFARequired) {
        setLoading(false);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 rounded-full blur-[100px] animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/30 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 glass-panel p-10 rounded-2xl"
      >
        <div>
          <h2 className="mt-2 text-center text-4xl font-bold text-white tracking-tight">
            {twoFARequired ? 'Two-Factor Auth' : (isLogin ? 'Welcome Back' : 'Join Linkify')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            {twoFARequired ? 'Enter the code from your authenticator app' : (isLogin ? 'Sign in to manage your links' : 'Create an account to get started')}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {twoFARequired ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="twoFACode" className="sr-only">2FA Code</label>
                <input
                  id="twoFACode"
                  name="twoFACode"
                  type="text"
                  required
                  className="glass-input appearance-none rounded-lg relative block w-full px-4 py-3 focus:outline-none sm:text-sm text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  maxLength={6}
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="sr-only">First Name</label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required={!isLogin}
                      className="glass-input appearance-none rounded-lg relative block w-full px-4 py-3 focus:outline-none sm:text-sm"
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="sr-only">Last Name</label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required={!isLogin}
                      className="glass-input appearance-none rounded-lg relative block w-full px-4 py-3 focus:outline-none sm:text-sm"
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="glass-input appearance-none rounded-lg relative block w-full px-4 py-3 focus:outline-none sm:text-sm"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  className="glass-input appearance-none rounded-lg relative block w-full px-4 py-3 focus:outline-none sm:text-sm"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 py-2 rounded-lg border border-red-500/20">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="glass-button group relative w-full flex justify-center py-3 px-4 text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {loading ? 'Processing...' : (twoFARequired ? 'Verify' : (isLogin ? 'Sign in' : 'Create Account'))}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                if (twoFARequired) {
                  setTwoFARequired(false);
                  setTwoFACode('');
                  setError('');
                } else {
                  setIsLogin(!isLogin);
                  setError('');
                  setFormData({ email: '', password: '', firstName: '', lastName: '' });
                }
              }}
              className="text-blue-300 hover:text-white text-sm font-medium transition-colors"
            >
              {twoFARequired ? "Back to Login" : (isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in")}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AuthForm;
