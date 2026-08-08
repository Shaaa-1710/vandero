import React, { useState } from 'react';
import { ShieldCheck, MapPin, CheckCircle, ArrowRight, AlertCircle, Building2, User, Phone, Lock, Mail, Shield } from 'lucide-react';
import client from '../api/client';
import { OFFICERS } from '../officer-dashboard/data/mockComplaints';

function LandingLoginPage({ onLoginSuccess, onOpenTrackComplaint }) {
  const [portalType, setPortalType] = useState('citizen'); // 'citizen' or 'officer'
  const [isRegister, setIsRegister] = useState(false);
  
  // Citizen state
  const [mobileNumber, setMobileNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Officer state
  const [officerIdentifier, setOfficerIdentifier] = useState('');
  const [officerPassword, setOfficerPassword] = useState('');
  const [officerDepartment, setOfficerDepartment] = useState('Roads & Highways');
  const [officerWard, setOfficerWard] = useState('Ward 1 — RS Puram');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleMobileChange = (e) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(cleaned);
  };

  const handleCitizenSubmit = async (e) => {
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
          role: 'citizen' 
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
          role: 'citizen' 
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
        setError("Authentication failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOfficerSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanId = officerIdentifier.trim().toLowerCase();

    // Check mock dataset or authenticate
    const foundOfficer = OFFICERS.find(
      (off) => off.email.toLowerCase() === cleanId || off.mobile_number === cleanId
    );

    const activeOfficer = foundOfficer || {
      id: "OFF-NEW",
      name: name || "Municipal Officer",
      email: cleanId.includes("@") ? cleanId : `${cleanId}@coimbatorecorp.gov.in`,
      role: "Ward Officer",
      department: officerDepartment,
      ward: officerWard
    };

    setTimeout(() => {
      onLoginSuccess({
        username: activeOfficer.name,
        role: 'ward_officer',
        officerData: activeOfficer
      });
      setLoading(false);
    }, 400);
  };

  const fillQuickOfficer = (demoEmail) => {
    const off = OFFICERS.find(o => o.email === demoEmail);
    if (off) {
      setOfficerIdentifier(off.email);
      setOfficerPassword("officer123");
      setOfficerDepartment(off.department);
      setOfficerWard(off.ward);
      setError(null);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-950 overflow-hidden font-sans">
      
      {/* Background Image */}
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
            <span>Coimbatore City Municipal Corporation Portal</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Report Civic Issues. <br />
            <span className="text-emerald-400">Upvote Complaints.</span> <br />
            Transform Coimbatore.
          </h1>

          <p className="text-sm md:text-base text-gray-300 max-w-xl leading-relaxed">
            Coimbatore Civic Pulse connects citizens with Municipal Ward Officers. Citizens pin potholes, water leaks, and street light issues. Officers receive real-time ranked action queues with a strict 14-day SLA.
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
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs text-white">Officer Portal</h4>
              <p className="text-[11px] text-gray-400 mt-1">Action dashboard with 14-day SLA enforcement.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Integrated Login / Register Card */}
        <div className="lg:col-span-5 w-full">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-emerald-100 p-6 md:p-8">
            
            {/* Top Switcher: Citizen Portal vs Officer Portal */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-4 border border-slate-200">
              <button
                type="button"
                onClick={() => { setPortalType('citizen'); setError(null); }}
                className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition flex items-center justify-center space-x-1.5 ${
                  portalType === 'citizen' ? 'bg-emerald-800 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Citizen Portal</span>
              </button>
              <button
                type="button"
                onClick={() => { setPortalType('officer'); setError(null); }}
                className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition flex items-center justify-center space-x-1.5 ${
                  portalType === 'officer' ? 'bg-[#00355f] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Officer Portal</span>
              </button>
            </div>

            {/* Sub-Toggle: Login vs Register */}
            <div className="flex bg-slate-50 p-1 rounded-lg mb-6 border border-slate-200">
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded transition ${
                  !isRegister ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded transition ${
                  isRegister ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {portalType === 'citizen' ? 'New Citizen Register' : 'New Officer Register'}
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {/* CITIZEN FORM */}
            {portalType === 'citizen' ? (
              <form onSubmit={handleCitizenSubmit} className="space-y-4">
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
                      placeholder="Enter username"
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
            ) : (
              /* OFFICER FORM */
              <form onSubmit={handleOfficerSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Official Email / Officer Mobile *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      value={officerIdentifier} 
                      onChange={(e) => setOfficerIdentifier(e.target.value)} 
                      placeholder="officer@coimbatorecorp.gov.in"
                      className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-xs focus:ring-2 focus:ring-[#00355f] focus:outline-none"
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password / Security Code *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input 
                      type="password" 
                      value={officerPassword} 
                      onChange={(e) => setOfficerPassword(e.target.value)} 
                      placeholder="••••••••"
                      className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-xs focus:ring-2 focus:ring-[#00355f] focus:outline-none"
                      required 
                    />
                  </div>
                </div>

                {isRegister ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Officer Name *</label>
                      <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="e.g. Mr. Karthikeyan"
                        className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-xs"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department</label>
                        <select
                          value={officerDepartment}
                          onChange={(e) => setOfficerDepartment(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-2 py-2 text-xs"
                        >
                          <option value="Roads & Highways">Roads & Highways</option>
                          <option value="Water Supply">Water Supply</option>
                          <option value="Sanitation">Sanitation</option>
                          <option value="Street Lighting">Street Lighting</option>
                          <option value="Electricity">Electricity</option>
                          <option value="Drainage">Drainage</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Ward</label>
                        <select
                          value={officerWard}
                          onChange={(e) => setOfficerWard(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-2 py-2 text-xs"
                        >
                          <option value="Ward 1 — RS Puram">Ward 1 — RS Puram</option>
                          <option value="Ward 2 — Gandhipuram">Ward 2 — Gandhipuram</option>
                          <option value="Ward 3 — Peelamedu">Ward 3 — Peelamedu</option>
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Quick Demo Officer Selection */
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Select Demo Officer Credentials:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => fillQuickOfficer("sathish@municipality.gov.in")}
                        className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-left font-medium"
                      >
                        ⚡ Electrical
                      </button>
                      <button
                        type="button"
                        onClick={() => fillQuickOfficer("ramesh.water@municipality.gov.in")}
                        className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-left font-medium"
                      >
                        💧 Water Supply
                      </button>
                      <button
                        type="button"
                        onClick={() => fillQuickOfficer("priya.roads@municipality.gov.in")}
                        className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-left font-medium"
                      >
                        🛣️ Roads
                      </button>
                      <button
                        type="button"
                        onClick={() => fillQuickOfficer("karthik.sanitation@municipality.gov.in")}
                        className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-left font-medium"
                      >
                        🧹 Sanitation
                      </button>
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#00355f] hover:bg-[#0f4c81] text-white py-3 rounded-lg font-bold text-xs shadow-lg transition flex items-center justify-center space-x-2 mt-2"
                >
                  <span>{loading ? 'Authenticating...' : (isRegister ? 'Register Municipal Officer' : 'Login to Officer Dashboard')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

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
