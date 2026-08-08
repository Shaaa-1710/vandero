import React, { useState, useEffect } from 'react';
import { Search, Navigation, Plus, ThumbsUp, AlertCircle, MapPin, CheckCircle, Clock } from 'lucide-react';
import Map from '../components/Map';
import client from '../api/client';

function CitizenDashboard({ wards, selectedWard, setSelectedWard, complaints, setComplaints, onOpenNewComplaint, onUpvote, pinLocation, setPinLocation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoadingSearch(true);

    try {
      const res = await client.get('/wards/search', { params: { query: searchQuery } });
      if (res.data) {
        setSelectedWard(res.data);
      }
    } catch (err) {
      alert("No matching ward found for search term.");
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
        },
        (error) => {
          alert("Geolocation failed: " + error.message);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-64px)] relative overflow-hidden bg-gray-100">
      
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
                placeholder="Search Ward Number or Street..."
                className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
            <button
              type="submit"
              disabled={loadingSearch}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-2 rounded-md text-xs font-semibold shadow transition"
            >
              Search
            </button>
          </form>

          <div className="flex space-x-2">
            <button
              onClick={handleGeolocation}
              className="flex-1 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center space-x-1 shadow-sm transition"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Use Current Location</span>
            </button>

            <button
              onClick={onOpenNewComplaint}
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-md text-xs font-bold flex items-center justify-center space-x-1 shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Complaint</span>
            </button>
          </div>
        </div>

        {/* Selected Ward Info Banner */}
        <div className="bg-emerald-800 text-white px-4 py-2 flex items-center justify-between text-xs">
          <span className="font-bold">
            {selectedWard ? `${selectedWard.ward_number} - ${selectedWard.name}` : 'All Coimbatore Wards'}
          </span>
          <span className="text-[11px] text-emerald-200">
            {complaints.length} Open Reports
          </span>
        </div>

        {/* Sidebar Complaint List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-xs uppercase text-gray-500 tracking-wider">
              Ranked Area Complaints
            </h3>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
              Ranked by Urgency & Upvotes
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
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
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
                  <span className="font-bold text-emerald-700 flex items-center">
                    👍 {c.vote_count} Upvotes
                  </span>
                  <button
                    onClick={() => onUpvote(c.id)}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold px-3 py-1 rounded text-xs flex items-center space-x-1 transition shadow-sm"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
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

        {/* Map Helper Badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-2 rounded-lg shadow-lg border border-emerald-100 text-xs z-20">
          <p className="font-bold text-emerald-900">📍 Interactive OpenStreetMap</p>
          <p className="text-gray-600 text-[11px]">Click anywhere on the map to place a pin for a new complaint.</p>
        </div>
      </div>

    </div>
  );
}

export default CitizenDashboard;
