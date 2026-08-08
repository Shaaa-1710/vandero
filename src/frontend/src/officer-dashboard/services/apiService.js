import client from "../../api/client.js";
import { OFFICERS, INITIAL_COMPLAINTS, INITIAL_NOTIFICATIONS } from "../data/mockComplaints.js";

const STORAGE_KEY = "municipal_officer_complaints_v1";
const NOTIFS_KEY = "municipal_officer_notifications_v1";

let inMemoryComplaints = [...INITIAL_COMPLAINTS];
let inMemoryNotifs = [...INITIAL_NOTIFICATIONS];

const loadComplaintsFromStorage = () => {
  try {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : inMemoryComplaints;
    }
    return inMemoryComplaints;
  } catch (err) {
    return inMemoryComplaints;
  }
};

const saveComplaintsToStorage = (complaints) => {
  inMemoryComplaints = complaints;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
    }
  } catch (err) {}
};

const loadNotificationsFromStorage = () => {
  try {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(NOTIFS_KEY);
      return saved ? JSON.parse(saved) : inMemoryNotifs;
    }
    return inMemoryNotifs;
  } catch (err) {
    return inMemoryNotifs;
  }
};

const saveNotificationsToStorage = (notifs) => {
  inMemoryNotifs = notifs;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(NOTIFS_KEY, JSON.stringify(notifs));
    }
  } catch (err) {}
};

const mapBackendToOfficerFormat = (raw) => {
  const isPending = raw.status === "Open" || raw.status === "Pending";
  const isOngoing = raw.status === "In Progress" || raw.status === "Ongoing";
  const isCompleted = raw.status === "Completed";
  const isVerification = raw.status === "Awaiting Verification";

  const mappedStatus = isPending ? "Pending" : isOngoing ? "Ongoing" : isVerification ? "Awaiting Verification" : isCompleted ? "Completed" : "Pending";
  const priority = raw.vote_count >= 5 ? "P1" : raw.vote_count >= 2 ? "P2" : "P3";

  return {
    id: `CID-${raw.id}`,
    rawId: raw.id,
    title: `${raw.category || 'Grievance'} — ${raw.street || 'Coimbatore'}`,
    description: raw.description || "",
    category: raw.category || "General",
    department: raw.category || "Roads & Highways",
    status: mappedStatus,
    priority: priority,
    slaDaysRemaining: raw.status === "Overdue" ? 0 : 12,
    isEscalated: raw.status === "Overdue",
    reportedAt: raw.created_at ? new Date(raw.created_at).toLocaleString() : "Just now",
    reporterName: raw.name || "Citizen",
    reporterPhone: raw.mobile_number || "9876543210",
    locationAddress: `${raw.street || 'Sir Shanmugam Road'}, Ward ${raw.ward_id || 1}, Coimbatore`,
    locationLat: raw.location_lat || 11.0168,
    locationLng: raw.location_lng || 76.9558,
    affectedResidentsCount: (raw.vote_count || 1) * 8,
    upvotesCount: raw.vote_count || 1,
    aiHazardLevel: raw.vote_count >= 5 ? "HIGH HAZARD" : "MEDIUM HAZARD",
    aiSeverityScore: raw.vote_count >= 5 ? 88 : 65,
    photoUrl: raw.photo_url || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800",
    officerResponse: null,
    resolutionEvidence: null,
    rejectionReason: null,
    history: [
      {
        id: `h-init-${raw.id}`,
        timestamp: raw.created_at ? new Date(raw.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Initial",
        actor: "System AI",
        action: "Grievance Classified & Ranked",
        details: `Assigned to Ward ${raw.ward_id || 1} Municipal Officer. SLA timer started.`
      }
    ]
  };
};

export const apiService = {
  getOfficers: () => OFFICERS,

  getComplaints: async (department = "All") => {
    try {
      // Fetch live complaints from FastAPI Backend
      const response = await client.get("/complaints/");
      const liveComplaints = response.data.map(mapBackendToOfficerFormat);
      
      // Combine with local mock complaints for comprehensive view
      const localComplaints = loadComplaintsFromStorage();
      const combined = [...liveComplaints, ...localComplaints.filter(l => !liveComplaints.some(b => b.id === l.id))];
      
      if (!department || department === "All") return combined;
      return combined;
    } catch (err) {
      console.warn("Backend offline/unreachable, falling back to local complaints store:", err);
      const allComplaints = loadComplaintsFromStorage();
      if (!department || department === "All") return allComplaints;
      return allComplaints;
    }
  },

  respondToComplaint: async (complaintId, responseData) => {
    const all = loadComplaintsFromStorage();
    const updated = all.map((item) => {
      if (item.id === complaintId) {
        const newHistory = [
          ...(item.history || []),
          {
            id: `h-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            actor: "Officer",
            action: "Responded with action plan",
            details: responseData.message
          }
        ];
        return {
          ...item,
          status: "Ongoing",
          officerResponse: {
            message: responseData.message,
            expectedDate: responseData.expectedDate,
            expectedTime: responseData.expectedTime,
            actionPlan: responseData.actionPlan,
            respondedAt: new Date().toLocaleString()
          },
          history: newHistory
        };
      }
      return item;
    });
    saveComplaintsToStorage(updated);
    return updated;
  },

  submitCompletionEvidence: async (complaintId, evidenceData) => {
    const all = loadComplaintsFromStorage();
    const updated = all.map((item) => {
      if (item.id === complaintId) {
        const newHistory = [
          ...(item.history || []),
          {
            id: `h-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            actor: "Officer",
            action: "Uploaded completion evidence",
            details: "Status changed to Awaiting Citizen Verification"
          }
        ];
        return {
          ...item,
          status: "Awaiting Verification",
          resolutionEvidence: {
            photoUrl: evidenceData.photoUrl || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800",
            description: evidenceData.description,
            submittedAt: new Date().toLocaleString()
          },
          history: newHistory
        };
      }
      return item;
    });
    saveComplaintsToStorage(updated);
    return updated;
  },

  getNotifications: () => loadNotificationsFromStorage(),

  markNotificationsRead: () => {
    const notifs = loadNotificationsFromStorage().map((n) => ({ ...n, read: true }));
    saveNotificationsToStorage(notifs);
    return notifs;
  }
};
