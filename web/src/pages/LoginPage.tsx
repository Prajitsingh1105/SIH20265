import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, Lock, User, ArrowRight, CheckCircle2, AlertCircle, Building2, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, verifyOtp, demoLogin } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [demoOtpHint, setDemoOtpHint] = useState<string | null>(null);
  const [phoneHint, setPhoneHint] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStep1Login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login({ username, password });
      if (res.requiresOtp) {
        setTempToken(res.tempToken);
        setDemoOtpHint(res.demoOtp || '123456');
        setPhoneHint(res.phoneMasked);
        setEmailHint(res.email);
        setOtp(res.demoOtp || '123456'); // Pre-fill in demo mode for frictionless experience
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2VerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempToken) return;
    setError(null);
    setLoading(true);

    try {
      await verifyOtp({ tempToken, otp });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSwitch = async (role: string, instCode?: string) => {
    setLoading(true);
    setError(null);
    try {
      await demoLogin(role, instCode);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Form Column (7 cols) */}
        <div className="md:col-span-7 bg-white p-8 rounded-2xl border border-gray-200 shadow-lg">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gov-navy-900 rounded-lg flex items-center justify-center text-amber-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gov-navy-900">
                {tempToken ? 'Two-Factor Authentication (2FA)' : 'Portal Authentication'}
              </h2>
              <p className="text-xs text-gray-500">
                AICTE Secure Security Deposit & FDR Management Access
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!tempToken ? (
            /* Step 1: Username & Password */
            <form onSubmit={handleStep1Login} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  User ID / Email / AISHE Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. institution1, officer1, admin1"
                    className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gov-navy-DEFAULT focus:border-gov-navy-DEFAULT"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gov-navy-DEFAULT focus:border-gov-navy-DEFAULT"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Default demo password for all accounts: <strong>demo123</strong></p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gov-navy-900 hover:bg-gov-navy-800 text-white font-bold text-sm rounded-lg shadow-sm transition disabled:opacity-50"
              >
                <span>{loading ? 'Verifying Credentials...' : 'Proceed to 2FA / OTP Verification'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Step 2: 2FA OTP */
            <form onSubmit={handleStep2VerifyOtp} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                <div className="flex items-center space-x-1.5 font-bold">
                  <KeyRound className="w-4 h-4 text-amber-700" />
                  <span>One-Time Password (OTP) Dispatched</span>
                </div>
                <p>
                  Sent to registered mobile <strong>{phoneHint}</strong> and email <strong>{emailHint}</strong>. Also visible in Mailpit (localhost:8025) and SMS Outbox.
                </p>
                {demoOtpHint && (
                  <p className="text-gov-navy-DEFAULT font-bold text-sm pt-1">
                    Demo Mode Fixed OTP: <span className="bg-white px-2 py-0.5 rounded border border-amber-300 tracking-widest">{demoOtpHint}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="block w-full text-center text-2xl tracking-[0.5em] font-mono py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gov-navy-DEFAULT focus:border-gov-navy-DEFAULT"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setTempToken(null)}
                  className="w-1/3 py-2.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 flex items-center justify-center space-x-2 py-2.5 bg-gov-navy-900 hover:bg-gov-navy-800 text-amber-400 font-bold text-sm rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  <span>{loading ? 'Validating...' : 'Verify & Enter Portal'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Demo Access Column (5 cols) */}
        <div className="md:col-span-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-900 font-extrabold text-sm">
              <span className="text-base">⚡</span>
              <span>1-CLICK DEMO ACCESS</span>
            </div>
            <p className="text-xs text-amber-800 mt-1">
              Select any role below to bypass manual credentials and explore the full workflow immediately:
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <button
              onClick={() => handleDemoSwitch('INSTITUTION', 'INST-1001')}
              className="w-full text-left p-3 bg-white hover:bg-amber-100/60 rounded-xl border border-amber-200 shadow-2xs transition group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-gov-navy-900">Sunrise Institute of Technology</span>
                <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">INST-1001</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">Role: Institution User (Submissions & Releases)</p>
            </button>

            <button
              onClick={() => handleDemoSwitch('INSTITUTION', 'INST-1002')}
              className="w-full text-left p-3 bg-white hover:bg-amber-100/60 rounded-xl border border-amber-200 shadow-2xs transition group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-gov-navy-900">Bharat College of Engineering</span>
                <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">INST-1002</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">Role: Institution User (Submissions & Renewals)</p>
            </button>

            <button
              onClick={() => handleDemoSwitch('SCRUTINY_OFFICER')}
              className="w-full text-left p-3 bg-white hover:bg-amber-100/60 rounded-xl border border-amber-200 shadow-2xs transition group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-gov-navy-900">Rajeev Menon</span>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded">AICTE Officer</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">Role: Scrutiny Officer (Review & Bank Verification)</p>
            </button>

            <button
              onClick={() => handleDemoSwitch('COMPETENT_AUTHORITY')}
              className="w-full text-left p-3 bg-white hover:bg-amber-100/60 rounded-xl border border-amber-200 shadow-2xs transition group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-gov-navy-900">Dr. Surendra Mohan</span>
                <span className="text-[10px] font-bold bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded">Authority</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">Role: Competent Authority (Final Release Approval)</p>
            </button>

            <button
              onClick={() => handleDemoSwitch('SYSTEM_ADMIN')}
              className="w-full text-left p-3 bg-white hover:bg-amber-100/60 rounded-xl border border-amber-200 shadow-2xs transition group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-gov-navy-900">Amitabh Verma</span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded">Admin</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">Role: System Admin (Lifecycle, Clock & Integrity)</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
