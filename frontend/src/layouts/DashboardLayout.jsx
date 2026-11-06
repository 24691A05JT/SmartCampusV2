import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import {
  Sparkles,
  LayoutDashboard,
  Calendar,
  Compass,
  Ticket,
  Award,
  CalendarDays,
  User,
  PlusCircle,
  ClipboardCheck,
  BarChart3,
  Users,
  CheckCircle,
  MessageSquare,
  ShieldAlert,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield
} from 'lucide-react';
import Badge from '../components/common/Badge';

export const DashboardLayout = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const userDropdownRef = useRef(null);

  // Close user dropdown on click-outside and handle Escape dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (userDropdownOpen) setUserDropdownOpen(false);
        if (sidebarOpen) setSidebarOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen, sidebarOpen]);

  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      if (!user) return;
      try {
        const res = await apiClient.get('/notifications/unread-count');
        if (isMounted && res.data?.unreadCount !== undefined) {
          setUnreadCount(res.data.unreadCount);
        }
      } catch (err) {
        // Silently catch background poll in layout
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user, location.pathname]);

  // Define navigation items dynamically based on authenticated role
  const getNavItems = () => {
    if (role === 'admin') {
      return [
        { name: 'Command Center', path: '/admin', icon: LayoutDashboard },
        { name: 'Event Approvals', path: '/admin/events', icon: CheckCircle },
        { name: 'User Governance', path: '/admin/users', icon: Users },
        { name: 'Registrations', path: '/admin/registrations', icon: Ticket },
        { name: 'Feedback Moderation', path: '/admin/feedback', icon: MessageSquare },
        { name: 'Certificate Registry', path: '/admin/certificates', icon: Award },
        { name: 'Audit Trail', path: '/admin/audit-logs', icon: ShieldAlert },
        { name: 'Campus Analytics', path: '/admin/analytics', icon: BarChart3 }
      ];
    }

    if (role === 'organizer') {
      return [
        { name: 'Organizer Dashboard', path: '/organizer', icon: LayoutDashboard },
        { name: 'Create Event', path: '/organizer/events/new', icon: PlusCircle },
        { name: 'Manage Events', path: '/organizer/events', icon: Calendar },
        { name: 'Attendance Manager', path: '/organizer/attendance', icon: ClipboardCheck },
        { name: 'Event Analytics', path: '/organizer/analytics', icon: BarChart3 }
      ];
    }

    // Default: Student navigation
    return [
      { name: 'Student Dashboard', path: '/student', icon: LayoutDashboard },
      { name: 'Explore Events', path: '/events', icon: Compass },
      { name: 'AI Recommendations', path: '/student/recommendations', icon: Sparkles },
      { name: 'My Registrations', path: '/student/registrations', icon: Ticket },
      { name: 'Personal Schedule', path: '/student/calendar', icon: CalendarDays },
      { name: 'My Certificates', path: '/student/certificates', icon: Award }
    ];
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadgeVariant = () => {
    if (role === 'admin') return 'danger';
    if (role === 'organizer') return 'warning';
    return 'primary';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Skip to Content Accessible Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-xl focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        Skip to main content
      </a>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        id="dashboard-sidebar"
        aria-label="Workspace navigation"
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 px-6 border-b border-slate-800/80 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white block leading-none">
                Smart<span className="text-indigo-400">Campus</span>
              </span>
              <span className="text-[10px] tracking-wider uppercase text-slate-400 font-medium">
                Portal Workspace
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Card */}
        <div className="p-4 mx-4 my-3 bg-slate-950/60 border border-slate-800/70 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'Authorized User'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant={getRoleBadgeVariant()} size="sm" hasDot>
                {role || 'Student'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/25'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.name}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-white/70" />}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 space-y-1">
          <Link
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              location.pathname === '/profile'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <User className="w-5 h-5 text-slate-400" />
            <span>Profile Settings</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-20 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              aria-expanded={sidebarOpen}
              aria-controls="dashboard-sidebar"
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Department: {user?.department || 'University Campus'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Trigger */}
            <Link
              to="/notifications"
              className="relative p-2.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl border border-slate-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-slate-950">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Profile Dropdown */}
            <div className="relative" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen((prev) => !prev)}
                aria-expanded={userDropdownOpen}
                aria-haspopup="menu"
                aria-controls="user-dropdown-menu"
                className="flex items-center gap-2.5 p-1.5 pl-3 bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 rounded-2xl transition-all cursor-pointer"
              >
                <div className="text-left hidden md:block">
                  <p className="text-xs font-semibold text-white leading-none">{user?.name || 'Account'}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">{role || 'Student'}</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </button>

              {userDropdownOpen && (
                <div
                  id="user-dropdown-menu"
                  role="menu"
                  aria-label="User account actions"
                  className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2.5 border-b border-slate-800">
                    <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    role="menuitem"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </Link>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Routed Page Area with Focus Target */}
        <main id="main-content" tabIndex="-1" className="flex-1 outline-none p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
