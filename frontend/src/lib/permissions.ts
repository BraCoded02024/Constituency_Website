/** Public-site admin (sidebar group and overview widgets). Off until that section should return. */
export const websiteAdminEnabled = false;

/** Public website (home, news, projects, and the rest). Off until after the primaries. */
export const publicSiteEnabled = false;

export const ALL_PRIVILEGES = [
  'dashboard',
  'announcements',
  'projects',
  'concerns',
  'events',
  'opportunities',
  'services',
  'gallery',
  'stories',
  'constituents',
  'volunteers',
  'delegates',
  'staff',
  'settings',
] as const;

export type Privilege = (typeof ALL_PRIVILEGES)[number];

export const PRIVILEGE_LABELS: Record<Privilege, string> = {
  dashboard: 'Overview',
  announcements: 'Announcements',
  projects: 'Projects',
  concerns: 'Concerns',
  events: 'Events',
  opportunities: 'Opportunities',
  services: 'Services',
  gallery: 'Gallery',
  stories: 'Success Stories',
  constituents: 'Constituents',
  volunteers: 'Volunteers',
  delegates: 'Delegates',
  staff: 'Staff & Roles',
  settings: 'Settings',
};

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  privileges: Privilege[];
  is_active?: boolean;
}

export function isSuperAdmin(role: string) {
  return role === 'super_admin';
}

export function hasPrivilege(user: AdminUser | null, privilege: Privilege) {
  if (!user) return false;
  if (isSuperAdmin(user.role)) return true;
  return user.privileges?.includes(privilege) ?? false;
}

export function navPrivilegeFromHref(href: string): Privilege {
  if (href === '/admin' || href === '/admin/') return 'dashboard';
  const segment = href.replace(/^\/admin\/?/, '').split('/')[0] || 'dashboard';
  const mapped: Record<string, Privilege> = {
    'electoral-areas': 'delegates',
    'polling-stations': 'delegates',
    'delegate-categories': 'delegates',
    'survey-dashboard': 'delegates',
    'follow-ups': 'delegates',
    sms: 'delegates',
    'delegate-reports': 'delegates',
    activity: 'delegates',
  };
  if (mapped[segment]) return mapped[segment];
  if ((ALL_PRIVILEGES as readonly string[]).includes(segment)) return segment as Privilege;
  return 'dashboard';
}
