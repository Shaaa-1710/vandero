import React, { useState } from 'react';
import { ShieldCheck, MapPin, CheckCircle, ArrowRight, AlertCircle, Phone } from 'lucide-react';
import client from '../api/client';

function LandingLoginPage({ onLoginSuccess, onOpenTrackComplaint }) {
  const [isRegister, setIsRegister] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleMobileChange = (e) => {
    // Only allow numbers and limit to max 10 digits
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(cleaned);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (mobileNumber.length !== 10) {
      setError("Mobile number must be exactly 10 digits (numbers only).");
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        const res = await client.post('/auth/register', {
          mobile_number: mobileNumber,
          username: username || undefined,
          password,
          name,
          email
        });
        localStorage.setItem('token', res.data.access_token);
        onLoginSuccess({ 
          mobile_number: res.data.mobile_number, 
          username: res.data.username || res.data.mobile_number, 
          role: res.data.role 
        });
      } else {
        const res = await client.post('/auth/login', {
          mobile_number: mobileNumber,
          password,
          role: 'citizen'
        });
        localStorage.setItem('token', res.data.access_token);
        onLoginSuccess({ 
          mobile_number: res.data.mobile_number, 
          username: res.data.username || res.data.mobile_number, 
          role: res.data.role 
        });
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          setError(detail.map(d => d.msg).join(', '));
        } else {
          setError(typeof detail === 'string' ? detail : JSON.stringify(detail));
        }
      } else {
        setError("Authentication failed. Please check your mobile number and password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-950 overflow-hidden">
      
      {/* Background Image showing dull civic problem overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter grayscale opacity-30 scale-105 transform transition duration-1000"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=2070&auto=format&fit=crop')` 
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-emerald-950/80" />

      {/* Main Container */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Hero Column */}
        <div className="lg:col-span-7 space-y-6 text-white">
          <div className="inline-flex items-center space-x-2 bg-emerald-900/80 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Official Coimbatore Municipal Portal</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Report Civic Issues. <br />
            <span className="text-emerald-400">Upvote Complaints.</span> <br />
            Transform Coimbatore.
          </h1>

          <p className="text-sm md:text-base text-gray-300 max-w-xl leading-relaxed">
            Coimbatore Civic Pulse empowers citizens to pin potholes, water leaks, and street light issues directly on live maps. Built-in Gemini AI duplicate prevention keeps municipal action fast and transparent.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
              <div className="p-2 bg-emerald-900/50 rounded-lg text-emerald-400 w-fit mb-2">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs text-white">Map-First Reporting</h4>
              <p className="text-[11px] text-gray-400 mt-1">Interactive OpenStreetMap with ward boundaries.</p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
              <div className="p-2 bg-emerald-900/50 rounded-lg text-emerald-400 w-fit mb-2">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs text-white">Gemini AI Check</h4>
              <p className="text-[11px] text-gray-400 mt-1">Prevents duplicate reports by comparing semantic meaning.</p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
              <div className="p-2 bg-emerald-900/50 rounded-lg text-emerald-400 w-fit mb-2">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs text-white">14-Day SLA</h4>
              <p className="text-[11px] text-gray-400 mt-1">Auto-escalation for unresolved complaints.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Embedded Login / Register Card */}
        <div className="lg:col-span-5 w-full">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-emerald-100 p-6 md:p-8">
            
            {/* Form Toggle Header */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  !isRegister ? 'bg-emerald-800 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  isRegister ? 'bg-emerald-800 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                New Citizen Register
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mobile Number (10 Digits) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-semibold">+91</span>
                  <input 
                    type="tel" 
                    value={mobileNumber} 
                    onChange={handleMobileChange} 
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    className="w-full border border-gray-300 rounded-lg pl-11 pr-3 py-2.5 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    required 
                  />
                </div>
              </div>

              {isRegister && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Username (Optional)</label>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    placeholder="Enter a username (optional)"
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password *</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  required 
                />
              </div>

              {isRegister && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="Enter full name"
                      className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email</label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="user@example.com"
                      className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs"
                    />
                  </div>
                </>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white py-3 rounded-lg font-bold text-xs shadow-lg transition flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Authenticating...' : (isRegister ? 'Create Citizen Account' : 'Login to Citizen Portal')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col space-y-2 text-center">
              <button
                type="button"
                onClick={onOpenTrackComplaint}
                className="text-xs text-emerald-800 hover:underline font-semibold"
              >
                Track an Existing Complaint Status →
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default LandingLoginPage;
