import React, { useState, useEffect } from 'react';
import { Search, Navigation, Plus, ThumbsUp, AlertCircle, MapPin, CheckCircle, Clock, Map as MapIcon } from 'lucide-react';
import Map from '../components/Map';
import client from '../api/client';

function CitizenDashboard({ wards, selectedWard, setSelectedWard, complaints, setComplaints, onOpenNewComplaint, onUpvote, pinLocation, setPinLocation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchAlertMessage, setSearchAlertMessage] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    const queryStr = searchQuery.trim();
    if (!queryStr) return;
    setLoadingSearch(true);
    setSearchAlertMessage('');

    try {
      // 1. Check local ward search
      const res = await client.get('/wards/search', { params: { query: queryStr } });
      if (res.data && res.data.centroid_lat && res.data.centroid_lng) {
        setSelectedWard(res.data);
        const lat = res.data.centroid_lat;
        const lng = res.data.centroid_lng;
        setPinLocation({ lat, lng });
        setSearchAlertMessage(`Zoomed and redirected to ${res.data.name} (${res.data.ward_number}). Map pin placed.`);
        setLoadingSearch(false);
        return;
      }
    } catch (err) {
      console.log("Ward search fallback to Nominatim geocoder...");
    }

    // 2. Fallback to OpenStreetMap Nominatim Geocoder for specific streets/locations in Coimbatore
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr + ', Coimbatore, Tamil Nadu')}`
      );
      const geoData = await geoRes.json();
      if (geoData && geoData.length > 0) {
        const top = geoData[0];
        const lat = parseFloat(top.lat);
        const lng = parseFloat(top.lon);

        // Find nearest ward or retain selected
        if (wards && wards.length > 0) {
          const nearestWard = wards[0];
          setSelectedWard(nearestWard);
        }

        setPinLocation({ lat, lng });
        setSearchAlertMessage(`Zoomed and redirected to "${top.display_name.split(',')[0]}". Map pin placed.`);
      } else {
        alert(`No location found for "${queryStr}". Please try searching "RS Puram", "Gandhipuram", "Peelamedu", or "Sir Shanmugam Road".`);
      }
    } catch (err) {
      alert("Error performing location search. Please try again.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleGeolocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setPinLocation({ lat, lng });
          setSearchAlertMessage("Zoomed to your current GPS position. Map pin placed.");
        },
        (error) => {
          alert("Geolocation failed: " + error.message);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleNewComplaintClick = () => {
    // STRICT MAP PIN VALIDATION: Block modal if pin is missing
    if (!pinLocation || !pinLocation.lat || !pinLocation.lng) {
      alert("⚠️ Map Pin Required: Click on the map to mark complaint location.");
      return;
    }
    onOpenNewComplaint();
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-64px)] relative overflow-hidden bg-gray-100 font-sans">
      
      {/* Sidebar: Area Complaints & Controls */}
      <div className="w-full md:w-96 bg-white border-r shadow-lg flex flex-col z-20 h-full">
        
        {/* Search Bar & Location Controls */}
        <div className="p-4 border-b bg-emerald-50/50 space-y-3">
          <form onSubmit={handleSearch} className="flex space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search street, ward or landmark (e.g. RS Puram)..."
                className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
            <button
              type="submit"
              disabled={loadingSearch}
              className="bg-[#065f46] hover:bg-emerald-800 text-white px-3.5 py-2 rounded-md text-xs font-bold shadow transition"
            >
              {loadingSearch ? 'Searching...' : 'Search'}
            </button>
          </form>

          {searchAlertMessage && (
            <div className="p-2 bg-emerald-100 border border-emerald-300 rounded text-[11px] text-emerald-900 font-semibold">
              ✨ {searchAlertMessage}
            </div>
          )}

          <div className="flex space-x-2">
            <button
              onClick={handleGeolocation}
              className="flex-1 bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-50 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center space-x-1 shadow-sm transition"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-700" />
              <span>Use GPS Location</span>
            </button>

            <button
              onClick={handleNewComplaintClick}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold flex items-center justify-center space-x-1 shadow transition ${
                pinLocation 
                  ? "bg-[#065f46] hover:bg-emerald-800 text-white ring-2 ring-emerald-400"
                  : "bg-amber-600 hover:bg-amber-700 text-white animate-pulse"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>+ New Complaint</span>
            </button>
          </div>
        </div>

        {/* Selected Ward Info Banner */}
        <div className="bg-[#065f46] text-white px-4 py-2 flex items-center justify-between text-xs border-b border-emerald-700">
          <span className="font-bold">
            {selectedWard ? `${selectedWard.ward_number} - ${selectedWard.name}` : 'Coimbatore Ward 1'}
          </span>
          <span className="text-[11px] text-emerald-200 font-semibold">
            {complaints.length} Open Reports
          </span>
        </div>

        {/* Sidebar Complaint List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-xs uppercase text-gray-500 tracking-wider">
              Ranked Area Complaints
            </h3>
            <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
              Severity & Upvotes First
            </span>
          </div>

          {complaints.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              No open complaints reported in this area yet.
            </div>
          ) : (
            complaints.map(c => (
              <div 
                key={c.id} 
                className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-sm hover:shadow transition space-y-2"
              >
                <div className="flex items-start justify-between">
                  <span className="font-bold text-gray-900 text-xs line-clamp-1">{c.category}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    c.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                    c.status === 'Overdue' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <p className="text-xs text-gray-700 line-clamp-2">{c.description}</p>

                <div className="flex items-center text-[11px] text-gray-500 space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="truncate">{c.street}</span>
                </div>

                {c.photo_url && (
                  <img 
                    src={c.photo_url} 
                    alt="Live Photo" 
                    className="w-full h-24 object-cover rounded border border-gray-100 mt-1"
                  />
                )}

                <div className="flex items-center justify-between pt-2 border-t text-xs">
                  <span className="font-bold text-emerald-800 flex items-center">
                    👍 {c.vote_count} Upvotes
                  </span>
                  <button
                    onClick={() => onUpvote(c.id)}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold px-3 py-1 rounded text-xs flex items-center space-x-1 transition shadow-sm"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Upvote Issue</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Main Area: Map View (Always Visible) */}
      <div className="flex-1 h-full relative">
        <Map 
          wards={wards}
          complaints={complaints}
          selectedWard={selectedWard}
          onSelectLocation={(lat, lng) => setPinLocation({ lat, lng })}
          onUpvote={onUpvote}
          pinLocation={pinLocation}
        />

        {/* STRICT REQUIRED MAP PIN BANNER */}
        <div className={`absolute top-4 left-4 right-4 md:left-auto md:right-4 z-20 p-3 rounded-xl shadow-xl backdrop-blur-md flex items-center justify-between border ${
          pinLocation 
            ? "bg-emerald-900/90 text-white border-emerald-500/40" 
            : "bg-amber-600/95 text-white border-amber-400 animate-pulse"
        }`}>
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 shrink-0 text-white" />
            <div>
              <p className="font-bold text-xs sm:text-sm">
                {pinLocation 
                  ? `📍 Location Marked (${pinLocation.lat.toFixed(4)}, ${pinLocation.lng.toFixed(4)})` 
                  : "⚠️ Map Pin Required: Click on the map to mark complaint location."}
              </p>
              <p className="text-[11px] text-white/90">
                {pinLocation 
                  ? "Ready to post complaint! Click '+ New Complaint' to proceed." 
                  : "Strict constraint: You cannot submit a complaint without marking the exact location pin."}
              </p>
            </div>
          </div>
          {pinLocation && (
            <span className="ml-3 bg-white text-emerald-900 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
              Pin Set
            </span>
          )}
        </div>
      </div>

    </div>
  );
}

export default CitizenDashboard;
