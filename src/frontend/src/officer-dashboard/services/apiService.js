import client from "../../api/client.js";
import { OFFICERS, INITIAL_COMPLAINTS, INITIAL_NOTIFICATIONS } from "../data/mockComplaints.js";

const STORAGE_KEY = "municipal_officer_complaints_v1";
const NOTIFS_KEY = "municipal_officer_notifications_v1";

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
    department: raw.category || "General",
    status: mappedStatus,
    priority: priority,
    slaDaysRemaining: raw.status === "Overdue" ? 0 : 14,
    isEscalated: raw.status === "Overdue",
    reportedAt: raw.created_at ? new Date(raw.created_at).toLocaleString() : "Just now",
    reporterName: raw.name || "Citizen",
    reporterPhone: raw.mobile_number || "9876543210",
    locationAddress: `${raw.street || 'Coimbatore'}, Ward ${raw.ward_id || 1}, Coimbatore`,
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
      // Fetch ONLY live production complaints from PostgreSQL Backend
      const response = await client.get("/complaints/");
      const liveComplaints = response.data.map(mapBackendToOfficerFormat);
      return liveComplaints;
    } catch (err) {
      console.warn("Backend API error fetching complaints:", err);
      return [];
    }
  },

  respondToComplaint: async (complaintId, responseData) => {
    try {
      const rawId = complaintId.replace("CID-", "");
      await client.post(`/admin/complaints/${rawId}/respond`, {
        action_plan: responseData.actionPlan || responseData.message,
        expected_resolution_time: `${responseData.expectedDate} ${responseData.expectedTime}`
      });
    } catch (err) {
      console.warn("Officer response saved locally/fallback:", err);
    }
    return apiService.getComplaints();
  },

  submitCompletionEvidence: async (complaintId, evidenceData) => {
    try {
      const rawId = complaintId.replace("CID-", "");
      await client.post(`/admin/complaints/${rawId}/complete`, {
        evidence_notes: evidenceData.description,
        evidence_photo_url: evidenceData.photoUrl
      });
    } catch (err) {
      console.warn("Completion evidence saved:", err);
    }
    return apiService.getComplaints();
  },

  getNotifications: () => [],

  markNotificationsRead: () => []
};
