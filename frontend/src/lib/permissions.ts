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
  if (href === '/admin') return 'dashboard';
  const segment = href.replace('/admin/', '');
  return segment as Privilege;
}
