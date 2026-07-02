const ALL_PRIVILEGES = [
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
];

const PRIVILEGE_LABELS = {
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

function parsePrivileges(raw) {
  if (Array.isArray(raw)) return raw.filter((p) => ALL_PRIVILEGES.includes(p));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((p) => ALL_PRIVILEGES.includes(p)) : [];
  } catch {
    return [];
  }
}

function isSuperAdmin(role) {
  return role === 'super_admin';
}

function hasPrivilege(user, privilege) {
  if (!user) return false;
  if (isSuperAdmin(user.role)) return true;
  const privs = parsePrivileges(user.privileges);
  return privs.includes(privilege);
}

function hasAnyPrivilege(user, privileges) {
  return privileges.some((p) => hasPrivilege(user, p));
}

function serializeUser(admin) {
  const privileges = isSuperAdmin(admin.role) ? ALL_PRIVILEGES : parsePrivileges(admin.privileges);
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    privileges,
    is_active: admin.is_active !== false,
    created_at: admin.created_at,
  };
}

module.exports = {
  ALL_PRIVILEGES,
  PRIVILEGE_LABELS,
  parsePrivileges,
  isSuperAdmin,
  hasPrivilege,
  hasAnyPrivilege,
  serializeUser,
};
