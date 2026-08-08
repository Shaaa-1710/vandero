import React, { useState } from 'react';
import { X, AlertCircle, ThumbsUp, ShieldAlert } from 'lucide-react';
import CameraCapture from './CameraCapture';
import client from '../api/client';

const CATEGORIES = [
  "Roads & Potholes",
  "Street Lights",
  "Water Supply & Leaks",
  "Drainage & Sewage",
  "Sanitation & Garbage",
  "Electricity",
  "Corporation Issues",
  "Revenue Department",
  "Ration Shop",
  "Pension & Schemes",
  "Public Transport",
  "Health & Hygiene",
  "Education",
  "Others"
];

function NewComplaintModal({ isOpen, onClose, selectedWard, pinLocation, onCreated, onUpvote }) {
  const [step, setStep] = useState(1); // 1: Duplicate Pre-Check, 2: Form Input
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [street, setStreet] = useState('');
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [communicationAddress, setCommunicationAddress] = useState('');
  const [gender, setGender] = useState('Male');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');
  
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [preCheckMatches, setPreCheckMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handlePreCheck = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await client.post('/complaints/precheck-duplicate', null, {
        params: { ward_id: selectedWard ? selectedWard.id : 1, category }
      });
      setPreCheckMatches(res.data);
      setStep(2);
    } catch (err) {
      setError("Error checking duplicate complaints. Proceeding to form.");
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!name || !street || !description || !mobileNumber || !email || !communicationAddress) {
      setError("Please fill in all mandatory fields.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('street', street);
    formData.append('description', description);
    formData.append('mobile_number', mobileNumber);
    formData.append('communication_address', communicationAddress);
    formData.append('category', category);
    formData.append('gender', gender);
    formData.append('email', email);
    formData.append('ward_id', selectedWard ? selectedWard.id : 1);
    formData.append('location_lat', pinLocation ? pinLocation.lat : (selectedWard ? selectedWard.centroid_lat : 11.0168));
    formData.append('location_lng', pinLocation ? pinLocation.lng : (selectedWard ? selectedWard.centroid_lng : 76.9558));

    if (pincode) formData.append('pincode', pincode);
    if (landmark) formData.append('landmark', landmark);
    if (capturedPhoto) formData.append('photo', capturedPhoto.file);

    try {
      const res = await client.post('/complaints/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onCreated(res.data);
      onClose();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'object' && detail.message) {
          setError(`🤖 Gemini AI Duplicate Prevention: ${detail.message} (Reason: ${detail.reason})`);
        } else {
          setError(typeof detail === 'string' ? detail : JSON.stringify(detail));
        }
      } else {
        setError("Failed to create complaint. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-emerald-100 my-8">
        
        {/* Header */}
        <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Report Civic Complaint</h3>
            <p className="text-xs text-emerald-200">
              Coimbatore Ward: {selectedWard ? `${selectedWard.ward_number} (${selectedWard.name})` : 'Ward 1'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-emerald-700 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-4 p-3 bg-red-50 text-red-800 rounded-lg text-xs border border-red-200 flex items-start space-x-2">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Submission Alert</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Step 1: Duplicate Pre-Check */}
        {step === 1 && (
          <form onSubmit={handlePreCheck} className="p-6 space-y-4">
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <h4 className="font-bold text-emerald-900 text-sm mb-1">Step 1: Check Existing Area Complaints</h4>
              <p className="text-xs text-emerald-700">
                To keep civic resolution fast, check if your issue has already been reported by neighbors. Upvoting existing reports stacks community urgency!
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select Complaint Category *</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="pt-3 flex justify-end space-x-3">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-md text-xs font-semibold shadow transition"
              >
                {loading ? 'Checking Area...' : 'Continue to Check Nearby Issues'}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Form Entry & Duplicate Upvote Prompt */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            
            {/* Pre-Check Duplicate Warning Box */}
            {preCheckMatches.length > 0 && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg mb-4">
                <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm mb-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span>Existing Complaints Found in {category}!</span>
                </div>
                <p className="text-xs text-amber-800 mb-3">
                  Instead of creating a duplicate entry, upvote the existing report to boost its priority!
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {preCheckMatches.map(match => (
                    <div key={match.id} className="bg-white p-2.5 rounded border border-amber-200 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-gray-900">{match.street}</p>
                        <p className="text-gray-600 line-clamp-1">{match.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { onUpvote(match.id); onClose(); }}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded text-xs flex items-center space-x-1 shrink-0 ml-2"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Upvote ({match.vote_count})</span>
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-amber-700 mt-2 italic">
                  Still want to file a new unique report? Fill out the details below:
                </p>
              </div>
            )}

            {/* Mandatory Fields Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Enter full name"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mobile Number *</label>
                <input 
                  type="tel" 
                  value={mobileNumber} 
                  onChange={(e) => setMobileNumber(e.target.value)} 
                  placeholder="10-digit mobile"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address *</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="user@example.com"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Gender *</label>
                <select 
                  value={gender} 
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Street / Location *</label>
              <input 
                type="text" 
                value={street} 
                onChange={(e) => setStreet(e.target.value)} 
                placeholder="Enter street or area name"
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Communication Address *</label>
              <textarea 
                value={communicationAddress} 
                onChange={(e) => setCommunicationAddress(e.target.value)} 
                placeholder="Door No., Building, Street Name, Area, Coimbatore"
                rows="2"
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Complaint Description *</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Describe the problem clearly..."
                rows="3"
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
                required 
              />
            </div>

            {/* Optional Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Pincode (Optional)</label>
                <input 
                  type="text" 
                  value={pincode} 
                  onChange={(e) => setPincode(e.target.value)} 
                  placeholder="641001"
                  className="w-full border border-gray-200 rounded px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Landmark (Optional)</label>
                <input 
                  type="text" 
                  value={landmark} 
                  onChange={(e) => setLandmark(e.target.value)} 
                  placeholder="Near Post Office"
                  className="w-full border border-gray-200 rounded px-3 py-1.5 text-xs"
                />
              </div>
            </div>

            {/* Camera Only Photo Capture */}
            <CameraCapture 
              onCapture={(file, previewUrl) => setCapturedPhoto({ file, previewUrl })}
              capturedFile={capturedPhoto}
              onClear={() => setCapturedPhoto(null)}
            />

            {/* Actions */}
            <div className="pt-4 flex justify-between items-center border-t">
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="text-xs text-emerald-800 font-semibold hover:underline"
              >
                ← Back to Pre-Check
              </button>
              <div className="flex space-x-3">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="px-4 py-2 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded text-xs font-bold shadow transition flex items-center space-x-1"
                >
                  {loading ? 'Submitting & AI Verification...' : 'Submit Complaint'}
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}

export default NewComplaintModal;
