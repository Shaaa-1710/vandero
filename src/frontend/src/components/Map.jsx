import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix Leaflet marker icons default path in Vite bundle
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom status color pins
const getMarkerIcon = (status) => {
  let color = '#059669'; // Emerald for Open
  if (status === 'In Progress') color = '#2563eb'; // Blue
  if (status === 'Resolved') color = '#16a34a'; // Green
  if (status === 'Overdue' || status === 'Escalated') color = '#dc2626'; // Red

  const svgMarker = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32" stroke="#ffffff" stroke-width="1.5">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;

  return L.divIcon({
    html: svgMarker,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -30],
  });
};

function Map({ wards, complaints, selectedWard, onSelectLocation, onUpvote, pinLocation }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const geojsonLayersRef = useRef([]);
  const complaintMarkersRef = useRef([]);
  const tempPinRef = useRef(null);

  useEffect(() => {
    if (!leafletMapRef.current && mapRef.current) {
      // Default to Coimbatore center
      const map = L.map(mapRef.current, {
        zoomControl: true,
        tap: true
      }).setView([11.0168, 76.9558], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      map.on('click', (e) => {
        if (onSelectLocation) {
          onSelectLocation(e.latlng.lat, e.latlng.lng);
        }
      });

      leafletMapRef.current = map;
    }

    const handleResize = () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    const observer = new ResizeObserver(() => handleResize());
    if (mapRef.current) {
      observer.observe(mapRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      observer.disconnect();
    };
  }, []);

  // Update Ward GeoJSON Layers
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    // Clear existing geojson layers
    geojsonLayersRef.current.forEach(layer => map.removeLayer(layer));
    geojsonLayersRef.current = [];

    wards.forEach(ward => {
      if (ward.geojson_boundary) {
        const isSelected = selectedWard && selectedWard.id === ward.id;
        const layer = L.geoJSON(ward.geojson_boundary, {
          style: {
            color: isSelected ? '#047857' : '#0284c7',
            weight: isSelected ? 3 : 1.5,
            fillColor: isSelected ? '#059669' : '#38bdf8',
            fillOpacity: isSelected ? 0.25 : 0.1
          }
        }).addTo(map);

        layer.bindTooltip(`<b>${ward.ward_number} - ${ward.name}</b>`, { sticky: true });
        geojsonLayersRef.current.push(layer);
      }
    });

    if (selectedWard) {
      map.flyTo([selectedWard.centroid_lat, selectedWard.centroid_lng], 14, { duration: 1.2 });
    }
  }, [wards, selectedWard]);

  // Update Complaint Pins
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    complaintMarkersRef.current.forEach(marker => map.removeLayer(marker));
    complaintMarkersRef.current = [];

    complaints.forEach(complaint => {
      if (complaint.location_lat && complaint.location_lng) {
        const marker = L.marker([complaint.location_lat, complaint.location_lng], {
          icon: getMarkerIcon(complaint.status)
        }).addTo(map);

        const popupContent = document.createElement('div');
        popupContent.className = 'p-1 font-sans text-xs max-w-[80vw] sm:max-w-xs';
        popupContent.innerHTML = `
          <div class="font-bold text-sm text-gray-900 mb-1">${complaint.category}</div>
          <p class="text-gray-700 mb-2 line-clamp-3">${complaint.description}</p>
          <div class="flex items-center justify-between text-gray-500 mb-2 border-t pt-1">
            <span class="truncate">📍 ${complaint.street}</span>
            <span class="px-1.5 py-0.5 rounded font-semibold text-[10px] ${
              complaint.status === 'Resolved' ? 'bg-green-100 text-green-800' :
              complaint.status === 'Overdue' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
            }">${complaint.status}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="font-bold text-emerald-700">👍 ${complaint.vote_count} Upvotes</span>
            <button id="upvote-btn-${complaint.id}" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 py-1 rounded text-xs shadow-sm transition">
              + Upvote Issue
            </button>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 300 });
        
        marker.on('popupopen', () => {
          const btn = document.getElementById(`upvote-btn-${complaint.id}`);
          if (btn) {
            btn.onclick = () => {
              if (onUpvote) onUpvote(complaint.id);
            };
          }
        });

        complaintMarkersRef.current.push(marker);
      }
    });
  }, [complaints]);

  // Update Temporary Selected Pin
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    if (tempPinRef.current) {
      map.removeLayer(tempPinRef.current);
      tempPinRef.current = null;
    }

    if (pinLocation) {
      const pinIcon = L.divIcon({
        html: `
          <div class="animate-bounce text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="36" height="36">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        `,
        className: 'temp-pin',
        iconSize: [36, 36],
        iconAnchor: [18, 36]
      });

      tempPinRef.current = L.marker([pinLocation.lat, pinLocation.lng], { icon: pinIcon }).addTo(map);
      map.flyTo([pinLocation.lat, pinLocation.lng], 15);
    }
  }, [pinLocation]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full min-h-[350px] sm:min-h-[450px] z-10" />
    </div>
  );
}

export default Map;
