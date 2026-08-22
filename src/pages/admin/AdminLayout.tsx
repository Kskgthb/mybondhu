import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminEmail } from '@/config/adminConfig';
import {
  LayoutDashboard, Users, ClipboardList, ShieldCheck,
  BarChart3, Menu, X, LogOut, ArrowLeft, ChevronRight, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

const navItems = [
  { label: 'Overview',      path: '/admin/dashboard',      icon: LayoutDashboard },
  { label: 'Users',         path: '/admin/users',          icon: Users },
  { label: 'Tasks',         path: '/admin/tasks',          icon: ClipboardList },
  { label: 'Verifications', path: '/admin/verifications',  icon: ShieldCheck },
  { label: 'Analytics',     path: '/admin/analytics',      icon: BarChart3 },
  { label: 'Site Visitors', path: '/admin/site-visitors',  icon: Globe },
];

export default function AdminLayout() {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Guard: only admin emails allowed
  const userEmail = user?.email ?? profile?.email ?? '';
  if (!isAdminEmail(userEmail)) {
    navigate('/');
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  const initials = profile?.username?.substring(0, 2).toUpperCase() ?? 'AD';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#641ACC] to-indigo-600 flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-gray-900 font-bold text-sm leading-none">MyBondhu</p>
            <p className="text-[#641ACC] text-xs mt-0.5">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-[#641ACC] text-white shadow-lg shadow-[#641ACC]/30'
                  : 'text-gray-600 hover:bg-[#641ACC]/10 hover:text-[#641ACC]'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
            <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-60 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-gray-200 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-600 hover:text-[#641ACC] hover:bg-[#641ACC]/10 text-sm h-9"
          onClick={() => navigate('/need-bondhu/dashboard')}
        >
          <ArrowLeft className="w-4 h-4" />
          User View
        </Button>

        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-100">
          <Avatar className="h-7 w-7">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-[#641ACC] text-white text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 text-xs font-medium truncate">{profile?.username ?? 'Admin'}</p>
            <p className="text-[#641ACC] text-[10px] truncate">{userEmail}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-transparent flex-shrink-0"
            onClick={handleSignOut}
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F1F5F9] overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-white border-r border-gray-200 flex-shrink-0 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 flex flex-col bg-white border-r border-gray-200 shadow-lg transform transition-transform duration-300 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-4 lg:px-6 h-14 border-b border-gray-200 bg-white flex-shrink-0 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-gray-500 hover:text-[#641ACC] hover:bg-[#641ACC]/10"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1" />
          <span className="text-xs text-[#641ACC] font-medium bg-[#641ACC]/10 border border-[#641ACC]/20 px-2.5 py-1 rounded-full">
            Admin Mode
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
