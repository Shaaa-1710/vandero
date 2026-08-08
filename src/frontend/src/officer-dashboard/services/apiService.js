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

export const apiService = {
  getOfficers: () => OFFICERS,

  getComplaints: async (department = "All") => {
    const allComplaints = loadComplaintsFromStorage();
    if (!department || department === "All") return allComplaints;
    return allComplaints.filter((c) => c.department === department);
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
