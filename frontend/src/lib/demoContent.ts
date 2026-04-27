/**
 * Centralized demo / placeholder copy for the public UI.
 * Replace imports of this module with CMS or env-driven values when going to production.
 */

export const demoMetadata = {
  title: 'Sample Constituency — Demo Constituency Platform',
  description:
    'Demonstration constituency engagement platform. Explore announcements, projects, events, and community tools using neutral sample data.',
} as const;

export const demoContent = {
  badges: {
    system: 'Demo System',
    mode: 'Demo Mode',
  },
  constituency: {
    name: 'Sample Constituency',
    /** Short location line for footers / contact strips (no real address). */
    officeAddressLine: 'Constituency liaison office (demo — replace in deployment)',
    mapLine: 'Sample Constituency (demo)',
  },
  mp: {
    displayName: 'Member of Parliament (Demo)',
    profileSubtitle: 'Demo Profile – Constituency Representation',
    profileImageAlt: 'Demo representative profile placeholder',
    heroEyebrowMobile: 'Sample Constituency',
    welcomeShort:
      'Track projects, opportunities, and news — stay connected with your constituency office (demo).',
    welcomeLong:
      'Welcome to this demonstration constituency platform. Track projects, access opportunities, and stay engaged with community programmes — swap this copy when you connect real data.',
  },
  office: {
    navTagline: 'Constituency office (demo)',
    footerTagline: 'Constituency office (demo)',
    footerDescription:
      'Demonstration deployment for constituency engagement. Replace branding, contact details, and content before production use.',
  },
  contact: {
    phoneDisplay: '+233 (0) 000 000 000',
    emailDisplay: 'demo@example.invalid',
  },
  copyright: {
    line: 'Demo Constituency Platform — Sample Constituency',
    poweredBy: 'Demonstration build — replace with your organisation',
  },
  about: {
    pageTitle: 'About',
    pageSubtitle:
      'Neutral demo profile for constituency representation — replace with your representative\'s story.',
    sectionEyebrow: 'Representative profile (demo)',
    profileCardTitle: 'Member of Parliament (Demo)',
    profileFloatingTitle: 'Member of Parliament (Demo)',
    profileFloatingSubtitle: 'Sample Constituency',
    paragraphs: [
      'This page demonstrates how a Member of Parliament profile can be presented alongside constituency priorities. All biographical detail here is generic and intended for layout and UX review only.',
      'A production deployment would summarise the representative\'s focus areas, accessibility, and how residents can engage with the office — without relying on demo placeholders.',
      'Use the admin tools to publish real announcements, projects, and programmes when you are ready to go live.',
    ],
    timeline: [
      {
        year: '2024',
        event: 'Constituency engagement programme (demo)',
        details:
          'Sample milestone: launch of a structured channel for community feedback and development updates.',
      },
      {
        year: '2023',
        event: 'Infrastructure planning cycle (demo)',
        details:
          'Sample milestone: prioritisation of local infrastructure projects for transparent tracking.',
      },
      {
        year: '2022',
        event: 'Youth and skills initiative (demo)',
        details:
          'Sample milestone: pilot programme for training, mentorship, and opportunity signposting.',
      },
      {
        year: '2021',
        event: 'Office systems modernisation (demo)',
        details:
          'Sample milestone: move to digital registration, case tracking, and public communications.',
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
