/**
 * Centralized content for the NPP Suynani East party operations platform.
 */

export const demoMetadata = {
  title: 'NPP Suynani East — Party Operations Platform',
  description:
    'Official party operations system for NPP Suynani East. Projects, announcements, staff roles, and constituency programmes.',
} as const;

export const demoContent = {
  constituency: {
    name: 'NPP Suynani East',
    shortName: 'Suynani East',
    officeAddressLine: 'NPP Suynani East Constituency Office, Sunyani East, Bono Region',
    mapLine: 'NPP Suynani East Constituency Office',
  },
  platform: {
    name: 'NPP Suynani East',
    tagline: 'Party Operations Platform',
    heroEyebrow: 'NPP Suynani East',
    operationsTagline: 'Development in Freedom',
    welcomeShort:
      'Your constituency operations hub — track projects and stay connected with party programmes.',
    welcomeLong:
      'Welcome to the NPP Suynani East party operations platform. Coordinate constituency activities, support volunteers, track development projects, and keep members informed — all in one secure system.',
  },
  office: {
    navTagline: 'Development in Freedom',
    footerTagline: 'Development in Freedom',
    footerDescription:
      'Official NPP Suynani East operations platform for community projects, announcements, and constituency programmes.',
  },
  contact: {
    phoneDisplay: '+233 30 277 0000',
    phoneHref: 'tel:+233302770000',
    emailDisplay: 'info@npp-suynani-east.org.gh',
    emailHref: 'mailto:info@npp-suynani-east.org.gh',
    officeHours: 'Mon – Fri: 8:00 AM – 5:00 PM',
  },
  social: {
    website: '',
    whatsapp: '',
    facebook: '',
    youtube: '',
  },
  register: {
    pageTitle: 'Join constituency updates',
    pageSubtitle:
      'Share your details so the Suynani East office can reach you with programmes, events, and opportunities.',
    successTitle: "You're on the list",
  },
  copyright: {
    line: 'NPP Suynani East — Party Operations Platform',
  },
  about: {
    pageTitle: 'About the Platform',
    pageSubtitle:
      'Learn how NPP Suynani East uses this system to run transparent, efficient constituency operations.',
    sectionEyebrow: 'Party Operations',
    platformTitle: 'Built for Constituency Operations',
    platformSubtitle: 'NPP Suynani East',
    paragraphs: [
      'NPP Suynani East runs on a modern party operations platform designed for transparency, accountability, and efficient constituency management.',
      'From project tracking and announcements to concern resolution, every module supports the work of party executives, staff, and volunteers on the ground.',
      'Administrators can assign staff roles with specific privileges — controlling who can manage announcements, projects, events, and other areas of the system.',
    ],
    timeline: [
      {
        year: '2026',
        event: 'Operations Platform Launch',
        details:
          'Full rollout of the digital operations system for Suynani East — projects, staff roles, and public engagement in one place.',
      },
      {
        year: '2025',
        event: 'Staff Roles & RBAC',
        details:
          'Role-based access control so executives can assign module privileges to constituency staff.',
      },
      {
        year: '2024',
        event: 'Project Tracker',
        details:
          'Transparent tracking of constituency development projects with progress updates for members and the public.',
      },
      {
        year: '2023',
        event: 'Community Engagement Drive',
        details:
          'Expanded concern reporting, volunteer registration, and opportunity programmes across Suynani East communities.',
      },
    ],
  },
  nav: {
    aboutLinkLabel: 'About',
  },
  footer: {
    aboutLinkLabel: 'About',
  },
} as const;

export const operationModules = [
  { label: 'Projects', description: 'Track constituency development', href: '/projects' },
  { label: 'Concerns', description: 'Report community issues', href: '/concerns' },
  { label: 'Events', description: 'Party meetings & programmes', href: '/events' },
  { label: 'Announcements', description: 'Official notices & updates', href: '/announcements' },
  { label: 'Volunteers', description: 'Join constituency teams', href: '/volunteer' },
] as const;
