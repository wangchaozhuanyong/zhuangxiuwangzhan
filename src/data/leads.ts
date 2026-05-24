import { LeadItem } from "./types";

/**
 * Mock leads data — represents customer enquiries.
 * In production, this will be replaced with API calls to the backend.
 */
export const leadsData: LeadItem[] = [
  {
    id: "lead-1",
    name: "Ahmad Razak",
    phone: "+60 12-345 6789",
    email: "ahmad@example.com",
    message: "I want to renovate my 3-bedroom condo in Mont Kiara. Looking for full interior renovation including kitchen cabinets and wardrobes.",
    source: "website",
    serviceInterest: "Residential Renovation",
    status: "new",
    createdAt: "2025-03-20T10:30:00Z",
  },
  {
    id: "lead-2",
    name: "Sarah Lim",
    phone: "+60 17-876 5432",
    email: "sarah.lim@company.com",
    message: "Need office fit-out for a 3,000 sqft space in PJ. 40 workstations, 2 meeting rooms, pantry.",
    source: "google_ads",
    serviceInterest: "Commercial Renovation",
    status: "contacted",
    createdAt: "2025-03-18T14:15:00Z",
    notes: "Follow up scheduled for next week",
  },
  {
    id: "lead-3",
    name: "David Tan",
    phone: "+60 16-234 5678",
    email: "david.tan@email.com",
    message: "Looking for custom kitchen cabinet with island counter. Condo in Bangsar.",
    source: "whatsapp",
    serviceInterest: "Custom Built-In",
    status: "quoted",
    createdAt: "2025-03-15T09:00:00Z",
  },
  {
    id: "lead-4",
    name: "Lisa Wong",
    phone: "+60 19-876 1234",
    email: "lisa@retail.com",
    message: "Shop renovation at Cheras. Need new shopfront, signage, and interior display setup.",
    source: "referral",
    serviceInterest: "Exterior Works",
    status: "converted",
    createdAt: "2025-03-10T11:45:00Z",
  },
];
