/**
 * Centralized content for the NPP Political Party Management System.
 * Replace imports of this module with CMS or env-driven values when going to production.
 */

export const demoMetadata = {
  title: 'New Patriotic Party — Constituency Management Platform',
  description:
    'Official constituency management platform for the New Patriotic Party (NPP). Manage announcements, projects, events, delegates, and community engagement.',
} as const;

export const demoContent = {
  constituency: {
    name: 'New Patriotic Party',
    officeAddressLine: 'NPP Constituency Office, Ring Road Central, Accra',
    mapLine: 'NPP Constituency Office',
  },
  mp: {
    displayName: 'Constituency Chairman',
    profileSubtitle: 'NPP — Development in Freedom',
    profileImageAlt: 'Justina Owusu-Banahene, NPP representative',
    heroEyebrowMobile: 'New Patriotic Party',
    welcomeShort:
      'Track party projects, opportunities, and news — stay connected with NPP constituency activities.',
    welcomeLong:
      'Welcome to the New Patriotic Party constituency platform. Track projects, access opportunities, register as a delegate, and stay engaged with party programmes and community development initiatives.',
  },
  office: {
    navTagline: 'Development in Freedom',
    footerTagline: 'Development in Freedom',
    footerDescription:
      'Official NPP constituency engagement platform. Manage party activities, delegate registration, community projects, and constituency development programmes.',
  },
  contact: {
    phoneDisplay: '+233 30 277 0000',
    phoneHref: 'tel:+233302770000',
    emailDisplay: 'info@npp-constituency.org.gh',
    emailHref: 'mailto:info@npp-constituency.org.gh',
    officeHours: 'Mon – Fri: 8:00 AM – 5:00 PM',
  },
  social: {
    website: '',
    whatsapp: '',
    facebook: '',
    youtube: '',
  },
  register: {
    pageTitle: 'Join the constituency updates',
    pageSubtitle:
      'Share your details so the constituency office can reach you with programmes, events, and opportunities.',
    successTitle: "You're on the list",
  },
  copyright: {
    line: 'New Patriotic Party — Constituency Platform',
  },
  about: {
    pageTitle: 'About',
    pageSubtitle:
      'Learn about the New Patriotic Party constituency leadership and development initiatives.',
    sectionEyebrow: 'Party Leadership',
    profileCardTitle: 'Constituency Chairman',
    profileFloatingTitle: 'Constituency Chairman',
    profileFloatingSubtitle: 'New Patriotic Party',
    paragraphs: [
      'The New Patriotic Party (NPP) is committed to development in freedom, championing democratic governance, economic growth, and social progress across all constituencies.',
      'This platform enables transparent tracking of constituency projects, programmes, and engagement with party members, delegates, and the broader community.',
      'Use the platform to stay informed about party activities, register as a delegate, report concerns, and participate in community development initiatives.',
    ],
    timeline: [
      {
        year: '2024',
        event: 'Digital Constituency Platform Launch',
        details:
          'Launch of the modern NPP constituency management platform for transparent governance and party engagement.',
      },
      {
        year: '2023',
        event: 'Infrastructure Development Programme',
        details:
          'Major constituency infrastructure projects initiated — roads, schools, and healthcare facilities.',
      },
      {
        year: '2022',
        event: 'Youth Empowerment Initiative',
        details:
          'Launch of youth training, mentorship, and employment programmes across the constituency.',
      },
      {
        year: '2021',
        event: 'Party Modernisation Drive',
        details:
          'Adoption of digital tools for delegate management, voter registration, and constituency operations.',
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
