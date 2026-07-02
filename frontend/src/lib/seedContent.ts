/**
 * Constituency seed content — shown when the API is empty or unreachable.
 * Mirrors backend defaults so public pages stay populated in demos and offline use.
 */

export const seedAnnouncements = [
  {
    id: 'seed-announcement-1',
    title: 'Community Health Outreach Program',
    content:
      'Free health screening exercise for all constituents at the Constituency Health Center. Bring your NHIS card and a valid ID. Services include blood pressure checks, blood sugar tests, eye screening, and dental check-ups.',
    category: 'Health',
    date: '2026-04-25',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
    urgent: false,
  },
  {
    id: 'seed-announcement-2',
    title: 'Road Construction Update - Phase 2',
    content:
      'Phase 2 of the constituency road construction project begins next week. Affected areas include Main Street, Market Road, and School Lane. Please plan alternative routes during construction.',
    category: 'Infrastructure',
    date: '2026-04-20',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800',
    urgent: true,
  },
  {
    id: 'seed-announcement-3',
    title: 'Scholarship Applications Now Open',
    content:
      "The constituency education fund is now accepting applications for the 2026/2027 academic year. Eligible students from SHS to tertiary level can apply. Deadline: May 30, 2026.",
    category: 'Education',
    date: '2026-04-18',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c476?w=800',
    urgent: false,
  },
] as const;

export const seedProjects = [
  {
    id: 'seed-project-1',
    title: 'Constituency Road Rehabilitation',
    description: 'Complete rehabilitation of 15km of road network within the constituency including drainage systems.',
    status: 'In Progress',
    progress: 65,
    budget: 'GHS 2,500,000',
    startDate: '2026-01-15',
    endDate: '2026-08-30',
    contractor: 'GhanaRoads Construction Ltd',
    category: 'Infrastructure',
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800',
  },
  {
    id: 'seed-project-2',
    title: 'Community Library & ICT Center',
    description: 'Construction of a modern library and ICT center with 50 computers and high-speed internet.',
    status: 'In Progress',
    progress: 40,
    budget: 'GHS 800,000',
    startDate: '2026-02-01',
    endDate: '2026-09-30',
    contractor: 'BuildRight Ghana',
    category: 'Education',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
  },
  {
    id: 'seed-project-3',
    title: 'Borehole Drilling Project',
    description: '10 new boreholes across underserved communities to provide clean drinking water.',
    status: 'Completed',
    progress: 100,
    budget: 'GHS 450,000',
    startDate: '2025-09-01',
    endDate: '2026-03-15',
    contractor: 'AquaDrill Services',
    category: 'Water & Sanitation',
    image: 'https://images.unsplash.com/photo-1548839140-5a7f41051039?w=800',
  },
  {
    id: 'seed-project-4',
    title: 'Market Renovation Project',
    description: 'Renovation of the central market with new stalls, drainage, and fire safety systems.',
    status: 'Planning',
    progress: 10,
    budget: 'GHS 1,200,000',
    startDate: '2026-06-01',
    endDate: '2027-02-28',
    contractor: 'TBD',
    category: 'Commerce',
    image: null,
  },
  {
    id: 'seed-project-5',
    title: 'Street Lighting Installation',
    description: 'Installation of 200 solar-powered street lights across major roads and community centers.',
    status: 'In Progress',
    progress: 80,
    budget: 'GHS 600,000',
    startDate: '2025-11-01',
    endDate: '2026-05-30',
    contractor: 'SolarTech Ghana',
    category: 'Infrastructure',
    image: 'https://images.unsplash.com/photo-1513828583688-c52646db42f3?w=800',
  },
] as const;

export const seedSuccessStories = [
  {
    id: 'seed-story-1',
    name: 'Abena Osei',
    story:
      "Thanks to the constituency scholarship fund, I was able to complete my nursing degree at KNUST. I am now a registered nurse serving my community.",
    image: '',
    year: '2025',
  },
  {
    id: 'seed-story-2',
    name: 'Yaw Boateng',
    story:
      'The Youth in Agriculture program gave me the training and tools to start my poultry farm. I now employ 5 people from my community.',
    image: '',
    year: '2025',
  },
] as const;
