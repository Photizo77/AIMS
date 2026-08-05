// src/pages/auth/LoginMFA.tsx
// ============================================================
// AIMS — Login Page (Functional)
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function LoginMFA() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = login(email, password);

    if (success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError('Invalid credentials. Please check your email and password.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
  <img 
    src="https://i.postimg.cc/N0G2CsXY/Screenshot-2026-08-01-134115.png" 
    alt="Ardhi Logo" 
    className="h-20 w-auto mx-auto mb-4 object-contain"
  />
  <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">ARDHI</h1>
  <p className="text-sm text-gray-600 font-medium mt-1">Integrated Management System</p>
</div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Sign In</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@aims.org"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-aims-mint/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-aims-mint/50"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-aims-mint text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Sign In
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-3">Demo Accounts (use any password):</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-gray-400">cd@aims.org</span>
              <span className="text-gray-400">ed@aims.org</span>
              <span className="text-gray-400">sysadmin@aims.org</span>
              <span className="text-gray-400">admin@aims.org</span>
              <span className="text-gray-400">finance@aims.org</span>
              <span className="text-gray-400">grants@aims.org</span>
              <span className="text-gray-400">innovation@aims.org</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}