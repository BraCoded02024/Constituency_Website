'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useIsClient, useLocalStorageRaw, writeLocalStorage } from '@/lib/useIsClient';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard, Megaphone, FolderKanban, Calendar,
  AlertTriangle, Users, UserPlus, Image as ImageIcon, Star,
  Briefcase, Settings, LogOut, Menu, X, ChevronDown, ChevronLeft, Globe, Wrench, UserCheck, UserCog,
  MapPinned, Landmark, Tags, BarChart3, FileBarChart, History, Bell, MessageSquare,
} from 'lucide-react';
import FollowUpAlert from '@/components/admin/FollowUpAlert';
import FollowUpBell from '@/components/admin/FollowUpBell';
import { demoContent } from '@/lib/demoContent';
import { NPP_FLAG_SRC } from '@/lib/siteImages';
import {
  hasPrivilege,
  navPrivilegeFromHref,
  publicSiteEnabled,
  websiteAdminEnabled,
  type AdminUser,
  type Privilege,
} from '@/lib/permissions';

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; privilege: Privilege };

const navItems: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, privilege: 'dashboard' },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone, privilege: 'announcements' },
  { href: '/admin/projects', label: 'Projects', icon: FolderKanban, privilege: 'projects' },
  { href: '/admin/concerns', label: 'Concerns', icon: AlertTriangle, privilege: 'concerns' },
  { href: '/admin/events', label: 'Events', icon: Calendar, privilege: 'events' },
  { href: '/admin/opportunities', label: 'Opportunities', icon: Briefcase, privilege: 'opportunities' },
  { href: '/admin/services', label: 'Services', icon: Wrench, privilege: 'services' },
  { href: '/admin/gallery', label: 'Gallery', icon: ImageIcon, privilege: 'gallery' },
  { href: '/admin/stories', label: 'Success Stories', icon: Star, privilege: 'stories' },
  { href: '/admin/constituents', label: 'Constituents', icon: Users, privilege: 'constituents' },
  { href: '/admin/volunteers', label: 'Volunteers', icon: UserPlus, privilege: 'volunteers' },
  { href: '/admin/delegates', label: 'Delegates', icon: UserCheck, privilege: 'delegates' },
  { href: '/admin/follow-ups', label: 'Follow-ups', icon: Bell, privilege: 'delegates' },
  { href: '/admin/sms', label: 'SMS', icon: MessageSquare, privilege: 'delegates' },
  { href: '/admin/survey-dashboard', label: 'Survey Dashboard', icon: BarChart3, privilege: 'delegates' },
  { href: '/admin/delegate-reports', label: 'Delegate Reports', icon: FileBarChart, privilege: 'delegates' },
  { href: '/admin/electoral-areas', label: 'Electoral Areas', icon: MapPinned, privilege: 'delegates' },
  { href: '/admin/polling-stations', label: 'Polling Stations', icon: Landmark, privilege: 'delegates' },
  { href: '/admin/delegate-categories', label: 'Delegate Categories', icon: Tags, privilege: 'delegates' },
  { href: '/admin/activity', label: 'Activity', icon: History, privilege: 'delegates' },
  { href: '/admin/staff', label: 'Staff & Roles', icon: UserCog, privilege: 'staff' },
  { href: '/admin/settings', label: 'Settings', icon: Settings, privilege: 'settings' },
];

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const isActive = isNavActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        isActive
          ? 'bg-npp-blue text-white shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <item.icon size={18} />
      {item.label}
    </Link>
  );
}

function isNavActive(pathname: string, href: string) {
  return pathname === href || (href !== '/admin' && pathname.startsWith(href));
}

function parseAdminUser(raw: string | null): AdminUser | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useIsClient();
  const token = useLocalStorageRaw('admin_token');
  const storedUser = useLocalStorageRaw('admin_user');
  const user = useMemo(() => parseAdminUser(storedUser), [storedUser]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const onWebsiteRoute = navItems.some(
    (item) => item.privilege !== 'delegates' && isNavActive(pathname, item.href),
  );
  const [websiteOpen, setWebsiteOpen] = useState(onWebsiteRoute);

  useEffect(() => {
    if (onWebsiteRoute) setWebsiteOpen(true);
  }, [onWebsiteRoute]);

  useEffect(() => {
    if (!mounted || pathname === '/admin/login') return;
    if (!token || !user) {
      router.replace('/admin/login');
      return;
    }
    const required = navPrivilegeFromHref(pathname);
    if (!hasPrivilege(user, required)) {
      const firstAllowed = navItems.find((item) => hasPrivilege(user, item.privilege));
      router.replace(firstAllowed?.href || '/admin/login');
    }
  }, [mounted, pathname, token, user, router]);

  if (!mounted) return null;
  if (pathname === '/admin/login') return <>{children}</>;
  if (!user) return null;

  const visibleNav = navItems.filter((item) => hasPrivilege(user, item.privilege));
  const visibleDelegateNav = visibleNav.filter((item) => item.privilege === 'delegates');
  const visibleWebsiteNav = visibleNav.filter((item) => item.privilege !== 'delegates');

  const handleLogout = () => {
    writeLocalStorage('admin_token', null);
    writeLocalStorage('admin_user', null);
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-npp-blue flex items-center justify-center">
              <Image
                src={NPP_FLAG_SRC}
                alt="NPP"
                width={32}
                height={32}
                className="w-8 h-8 object-cover"
              />
            </div>
            <div>
              <span className="font-bold text-sm text-gray-900 block leading-tight">{demoContent.constituency.shortName}</span>
              <span className="text-[10px] text-npp-red font-medium">Operations Admin</span>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {visibleDelegateNav.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
          ))}

          {websiteAdminEnabled && visibleWebsiteNav.length > 0 && (
            <div className={visibleDelegateNav.length > 0 ? 'pt-2' : undefined}>
              <button
                type="button"
                onClick={() => setWebsiteOpen((open) => !open)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  onWebsiteRoute && !websiteOpen
                    ? 'bg-npp-blue/10 text-npp-blue'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Globe size={18} />
                <span className="flex-1 text-left">Website</span>
                <ChevronDown size={16} className={`transition-transform ${websiteOpen ? 'rotate-180' : ''}`} />
              </button>
              {websiteOpen && (
                <div className="mt-0.5 ml-3 pl-2 border-l border-gray-200 space-y-0.5">
                  {visibleWebsiteNav.map((item) => (
                    <NavLink key={item.href} item={item} pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-2">
          {publicSiteEnabled && (
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all"
            >
              <ChevronLeft size={18} />
              Back to Site
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>

        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-npp-blue/10 flex items-center justify-center text-npp-blue font-bold text-xs">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{user.role === 'super_admin' ? 'Super Admin' : 'Staff'}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0 w-full">
        <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur border-b border-gray-200 px-4 lg:px-6 h-14 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 hover:text-gray-900">
            <Menu size={22} />
          </button>
          <h2 className="text-sm font-semibold text-gray-700 capitalize flex-1">
            {pathname === '/admin' ? 'Overview' : pathname.split('/').pop()?.replace(/-/g, ' ') || ''}
          </h2>
          {hasPrivilege(user, 'delegates') && <FollowUpBell />}
        </header>

        <main className="flex-1 min-w-0 p-4 lg:p-6">
          {hasPrivilege(user, 'delegates') && pathname !== '/admin/follow-ups' && <FollowUpAlert />}
          {children}
        </main>
      </div>
    </div>
  );
}
