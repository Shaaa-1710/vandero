import React, { useState } from 'react';
import { MapPin, LogOut, ChevronDown, FileText, AlertCircle, PhoneCall, MessageSquare, Info } from 'lucide-react';

function Navbar({ user, onOpenLogin, onLogout, onOpenNewComplaint, onOpenTrackComplaint }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="bg-emerald-800 text-white shadow-md z-30 relative border-b border-emerald-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo / Title */}
          <div className="flex items-center space-x-3 cursor-pointer">
            <div className="bg-white p-2 rounded-full text-emerald-800 shadow-sm">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl leading-tight tracking-wide">Coimbatore Civic Pulse</h1>
              <p className="text-xs text-emerald-200">Coimbatore City Municipal Corporation</p>
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <button 
              onClick={() => alert("Coimbatore Civic Pulse connects citizens directly with Municipal Officers for rapid infrastructure resolution, duplicate prevention, and real-time grievance tracking.")}
              className="flex items-center space-x-1.5 hover:text-emerald-200 transition"
            >
              <Info className="w-4 h-4" />
              <span>About Us</span>
            </button>

            {/* Complaints Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-1.5 hover:text-emerald-200 transition focus:outline-none"
              >
                <FileText className="w-4 h-4" />
                <span>Complaints</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white text-gray-800 rounded-md shadow-xl py-1 z-50 border border-gray-100">
                  <button 
                    onClick={() => { setDropdownOpen(false); onOpenNewComplaint(); }}
                    className="flex items-center space-x-2 px-4 py-2 text-sm hover:bg-emerald-50 text-emerald-800 w-full text-left font-medium"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>New Complaint</span>
                  </button>
                  <button 
                    onClick={() => { setDropdownOpen(false); onOpenTrackComplaint(); }}
                    className="flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Track Complaint</span>
                  </button>
                  <button 
                    onClick={() => { setDropdownOpen(false); alert("Helpline: 1800-425-4020\nEmail: grievance@coimbatorecorp.gov.in\nAddress: Big Bazaar St, Town Hall, Coimbatore, TN 641001"); }}
                    className="flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Contact Us</span>
                  </button>
                  <button 
                    onClick={() => { setDropdownOpen(false); alert("Thank you for using Civic Pulse! Your feedback helps keep Coimbatore clean and functional."); }}
                    className="flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Feedback</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Auth Button / Profile Pill */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-xs bg-emerald-900/80 border border-emerald-600 px-3 py-1.5 rounded-full text-emerald-100 font-semibold shadow-inner">
                  👤 {user.username} (citizen)
                </span>
                <button 
                  onClick={onLogout}
                  className="p-1.5 hover:bg-emerald-700 rounded-full transition text-emerald-200"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={onOpenLogin}
                className="bg-white text-emerald-800 px-4 py-1.5 rounded-md font-bold text-sm hover:bg-emerald-50 transition shadow"
              >
                Login / Register
              </button>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;
