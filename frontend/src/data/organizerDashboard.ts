import type { OrganizerDashboardData } from '../types/organizer'

// SAMPLE DATA ONLY.
// Every company, number and zone here is fictional and exists for the
// frontend demo. Later, the dashboard service will return real API data
// in the same shape.

export const sampleOrganizerDashboard: OrganizerDashboardData = {
  isSample: true,
  applications: [
    { id: 'APP-1012', companyName: 'Brightwave Systems', industry: 'Technology & Software', eventId: 'nexus-tech-ai-expo', submittedAt: '2026-10-09T10:15:00', status: 'Pending review', isLocal: false },
    { id: 'APP-1011', companyName: 'Orbit Robotics', industry: 'Technology & Software', eventId: 'nexus-tech-ai-expo', submittedAt: '2026-10-08T15:40:00', status: 'Approved', isLocal: false },
    { id: 'APP-1010', companyName: 'Forge Dynamics', industry: 'Manufacturing & Engineering', eventId: 'industria-manufacturing-summit', submittedAt: '2026-10-07T09:05:00', status: 'Pending review', isLocal: false },
    { id: 'APP-1009', companyName: 'Titan Tooling Co.', industry: 'Manufacturing & Engineering', eventId: 'industria-manufacturing-summit', submittedAt: '2026-10-06T13:25:00', status: 'Approved', isLocal: false },
    { id: 'APP-1008', companyName: 'CarePoint Diagnostics', industry: 'Healthcare & Life Sciences', eventId: 'medix-healthcare-fair', submittedAt: '2026-10-05T11:50:00', status: 'Approved', isLocal: false },
    { id: 'APP-1007', companyName: 'Vitalis Health Tech', industry: 'Healthcare & Life Sciences', eventId: 'medix-healthcare-fair', submittedAt: '2026-10-04T16:10:00', status: 'Pending review', isLocal: false },
    { id: 'APP-1006', companyName: 'LearnLoop Labs', industry: 'Education & Training', eventId: 'edutech-campus-showcase', submittedAt: '2026-10-03T10:00:00', status: 'Approved', isLocal: false },
    { id: 'APP-1005', companyName: 'Campus Connect', industry: 'Education & Training', eventId: 'edutech-campus-showcase', submittedAt: '2026-10-02T14:30:00', status: 'Rejected', isLocal: false },
    { id: 'APP-1004', companyName: 'SunArc Energy', industry: 'Energy & Sustainability', eventId: 'greenfuture-sustainability-expo', submittedAt: '2026-10-01T09:20:00', status: 'Approved', isLocal: false },
    { id: 'APP-1003', companyName: 'ReLoop Materials', industry: 'Energy & Sustainability', eventId: 'greenfuture-sustainability-expo', submittedAt: '2026-09-30T12:45:00', status: 'Pending review', isLocal: false },
    { id: 'APP-1002', companyName: 'Studio Alder', industry: 'Design, Architecture & Interiors', eventId: 'design-interiors-week', submittedAt: '2026-09-29T15:15:00', status: 'Approved', isLocal: false },
    { id: 'APP-1001', companyName: 'Grain & Grid Furniture', industry: 'Design, Architecture & Interiors', eventId: 'design-interiors-week', submittedAt: '2026-09-28T10:35:00', status: 'Pending review', isLocal: false },
  ],
  allocatedBase: {
    'nexus-tech-ai-expo': 74,
    'industria-manufacturing-summit': 112,
    'medix-healthcare-fair': 51,
    'edutech-campus-showcase': 38,
    'greenfuture-sustainability-expo': 60,
    'design-interiors-week': 44,
  },
  footfall: [
    { hour: '09:00', visitors: 320 },
    { hour: '10:00', visitors: 540 },
    { hour: '11:00', visitors: 880 },
    { hour: '12:00', visitors: 1240 },
    { hour: '13:00', visitors: 1510 },
    { hour: '14:00', visitors: 1130 },
    { hour: '15:00', visitors: 960 },
    { hour: '16:00', visitors: 1080 },
    { hour: '17:00', visitors: 720 },
    { hour: '18:00', visitors: 410 },
  ],
  heat: [
    1, 2, 0, 3, 4, 2, 1,
    0, 1, 3, 4, 4, 2, 0,
    2, 3, 4, 3, 1, 0, 1,
    1, 0, 2, 2, 3, 2, 1,
  ],
  topZones: [
    { name: 'Hall B, Technology Zone', visitors: 2140 },
    { name: 'Hall A, Main Entrance Avenue', visitors: 1875 },
    { name: 'Hall C, Demo Stage', visitors: 1490 },
  ],
  activity: [
    { id: 's1', text: 'Orbit Robotics was approved for Nexus Tech & AI Expo.', time: '2026-10-09T09:30:00' },
    { id: 's2', text: 'Brightwave Systems submitted an application.', time: '2026-10-09T10:15:00' },
    { id: 's3', text: 'Campus Connect was not approved for EduTech Campus Showcase.', time: '2026-10-08T14:00:00' },
    { id: 's4', text: 'Studio Alder was approved for Design & Interiors Week.', time: '2026-10-07T11:45:00' },
  ],
}