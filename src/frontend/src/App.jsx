import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CitizenDashboard from './pages/CitizenDashboard';
import LandingLoginPage from './pages/LandingLoginPage';
import NewComplaintModal from './components/NewComplaintModal';
import TrackComplaintModal from './components/TrackComplaintModal';
import LoginModal from './components/LoginModal';
import client from './api/client';

function App() {
  const [user, setUser] = useState(null);

  const [wards, setWards] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);
  const [complaints, setComplaints] = useState([]);

  const [pinLocation, setPinLocation] = useState(null);
  
  const [isNewComplaintOpen, setIsNewComplaintOpen] = useState(false);
  const [isTrackComplaintOpen, setIsTrackComplaintOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Fetch Wards and Complaints
  const fetchData = async () => {
    try {
      const wardsRes = await client.get('/wards/');
      setWards(wardsRes.data);
      if (wardsRes.data.length > 0 && !selectedWard) {
        setSelectedWard(wardsRes.data[0]);
      }

      const complaintsRes = await client.get('/complaints/');
      setComplaints(complaintsRes.data);
    } catch (err) {
      console.error("Error loading initial data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpvote = async (complaintId) => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }
    try {
      await client.post(`/complaints/${complaintId}/upvote`);
      fetchData();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        alert(err.response.data.detail);
      } else {
        alert("Could not upvote complaint.");
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden font-sans">
      
      {/* Top Navigation */}
      <Navbar 
        user={user}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={() => setUser(null)}
        onOpenNewComplaint={() => {
          if (!user) setIsLoginOpen(true);
          else setIsNewComplaintOpen(true);
        }}
        onOpenTrackComplaint={() => setIsTrackComplaintOpen(true)}
      />

      {/* Main View: Landing Login Page if unauthenticated, else Citizen Dashboard */}
      {user ? (
        <CitizenDashboard 
          wards={wards}
          selectedWard={selectedWard}
          setSelectedWard={setSelectedWard}
          complaints={complaints}
          setComplaints={setComplaints}
          onOpenNewComplaint={() => {
            if (!user) setIsLoginOpen(true);
            else setIsNewComplaintOpen(true);
          }}
          onUpvote={handleUpvote}
          pinLocation={pinLocation}
          setPinLocation={setPinLocation}
        />
      ) : (
        <LandingLoginPage 
          onLoginSuccess={(userData) => setUser(userData)}
          onOpenTrackComplaint={() => setIsTrackComplaintOpen(true)}
        />
      )}

      {/* Popup Modals */}
      <NewComplaintModal 
        isOpen={isNewComplaintOpen}
        onClose={() => setIsNewComplaintOpen(false)}
        selectedWard={selectedWard}
        pinLocation={pinLocation}
        onCreated={() => fetchData()}
        onUpvote={handleUpvote}
      />

      <TrackComplaintModal 
        isOpen={isTrackComplaintOpen}
        onClose={() => setIsTrackComplaintOpen(false)}
        complaints={complaints}
      />

      <LoginModal 
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(userData) => setUser(userData)}
      />

    </div>
  );
}

export default App;
