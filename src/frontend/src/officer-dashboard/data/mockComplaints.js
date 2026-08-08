export const OFFICERS = [
  {
    id: "OFF-001",
    name: "Mr. Karthikeyan",
    email: "karthikeyan@coimbatorecorp.gov.in",
    mobile_number: "9876543210",
    role: "Ward Officer",
    department: "Roads & Highways",
    ward: "Ward 1 — RS Puram, Coimbatore"
  },
  {
    id: "OFF-002",
    name: "Ramesh Kumar",
    email: "ramesh.water@coimbatorecorp.gov.in",
    mobile_number: "9876543211",
    role: "Water Supply & Drainage Officer",
    department: "Water Supply",
    ward: "Ward 1 — RS Puram, Coimbatore"
  },
  {
    id: "OFF-003",
    name: "Priya Sundaram",
    email: "priya.roads@coimbatorecorp.gov.in",
    mobile_number: "9876543212",
    role: "Roads & Infrastructure Officer",
    department: "Roads & Highways",
    ward: "Ward 2 — Gandhipuram, Coimbatore"
  },
  {
    id: "OFF-004",
    name: "Karthik Raja",
    email: "karthik.sanitation@coimbatorecorp.gov.in",
    mobile_number: "9876543213",
    role: "Sanitary Inspector",
    department: "Sanitation",
    ward: "Ward 3 — Peelamedu, Coimbatore"
  }
];

export const INITIAL_COMPLAINTS = [
  {
    id: "CID-001",
    title: "Hanging electrical wire on main road",
    category: "Electrical",
    department: "Electrical",
    priority: "P1",
    priorityLabel: "P1 — Critical",
    priorityColor: "red",
    priorityScore: 95,
    severity: 9,
    status: "Pending", // Pending, Ongoing, Awaiting Verification, Completed, Reopened
    submissionDate: "Saturday, August 8, 2026",
    submissionTime: "8:00 AM",
    submittedAtISO: "2026-08-08T08:00:00.000Z",
    dateGroup: "TODAY — AUGUST 8",
    affectedResidents: 17,
    ward: "Ward 1 — RS Puram",
    locationAddress: "Main Street, Near Bus Stop #4, RS Puram, Coimbatore",
    lat: 11.0115,
    lng: 76.9515,
    description: "An electrical wire has been cut and is hanging across the street. It is very close to pedestrians and heavy vehicle movement. Needs urgent securing before nightfall.",
    citizenName: "Anandan S.",
    citizenPhone: "+91 98421 54321",
    reportedImageUrl: "https://images.unsplash.com/photo-1544724793-c6e382b63737?auto=format&fit=crop&q=80&w=800",
    aiAssessment: {
      severityScore: 9,
      severityLabel: "9 / 10 — Critical",
      urgency: "High",
      hazardType: "Electrical Safety Hazard",
      confidence: "93%",
      reasoning: "The uploaded image and description indicate a potentially dangerous hanging electrical wire in a public pedestrian/vehicle area."
    },
    communityImpact: [
      { id: 1, text: "17 citizens have indicated they are affected by this issue.", timestamp: "8:15 AM" },
      { id: 2, text: "School children cross this junction every morning.", timestamp: "8:30 AM" }
    ],
    officerResponse: null,
    resolutionEvidence: null,
    citizenVerification: null,
    resolutionAttempts: 0,
    isEscalated: false,
    history: [
      {
        id: "h-101",
        timestamp: "Aug 8, 8:00 AM",
        actor: "Citizen (Anandan S.)",
        action: "Submitted complaint",
        details: "Hanging electrical wire on main road"
      }
    ]
  },
  {
    id: "CID-002",
    title: "Major water pipeline leakage near Crosscut Road",
    category: "Water Supply & Leaks",
    department: "Water Supply",
    priority: "P2",
    priorityLabel: "P2 — Moderate",
    priorityColor: "amber",
    priorityScore: 78,
    severity: 7,
    status: "Ongoing",
    submissionDate: "Friday, August 7, 2026",
    submissionTime: "2:30 PM",
    submittedAtISO: "2026-08-07T14:30:00.000Z",
    dateGroup: "YESTERDAY — AUGUST 7",
    affectedResidents: 24,
    ward: "Ward 2 — Gandhipuram",
    locationAddress: "Crosscut Road Junction, Gandhipuram, Coimbatore",
    lat: 11.0215,
    lng: 76.9675,
    description: "Main supply pipeline valve burst flooding local pavement and causing water pressure loss for 50+ households.",
    citizenName: "Kavitha M.",
    citizenPhone: "+91 97890 12345",
    reportedImageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&q=80&w=800",
    aiAssessment: {
      severityScore: 7,
      severityLabel: "7 / 10 — Moderate",
      urgency: "Medium",
      hazardType: "Water Resource Loss",
      confidence: "88%",
      reasoning: "Pipeline leak detected on pavement."
    },
    communityImpact: [
      { id: 1, text: "24 residents upvoted this issue.", timestamp: "3:00 PM" }
    ],
    officerResponse: {
      message: "Maintenance crew dispatched. Valve replacement in progress.",
      expectedDate: "2026-08-09",
      expectedTime: "18:00",
      actionPlan: "Isolate segment valve, replace damaged PVC junction.",
      respondedAt: "Aug 7, 4:00 PM"
    },
    resolutionEvidence: null,
    citizenVerification: null,
    resolutionAttempts: 0,
    isEscalated: false,
    history: [
      {
        id: "h-102",
        timestamp: "Aug 7, 2:30 PM",
        actor: "Citizen (Kavitha M.)",
        action: "Submitted complaint",
        details: "Water leak"
      }
    ]
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "New P1 Critical Complaint Reported",
    message: "Hanging electrical wire on main road reported in RS Puram.",
    timestamp: "8:00 AM",
    type: "new_complaint",
    cid: "CID-001",
    read: false
  }
];
