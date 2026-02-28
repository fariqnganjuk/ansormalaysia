import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, MessageSquare, Users, BarChart3, UserCog, LogOut, ChevronLeft, ChevronRight, Home, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const ADMIN_NAV = [
  { name: 'Ringkasan', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Semua Konten', path: '/dashboard/posts', icon: FileText },
  { name: 'Kelola Berita', path: '/dashboard/posts/news', icon: FileText },
  { name: 'Kelola Kegiatan', path: '/dashboard/posts/activities', icon: FileText },
  { name: 'Kelola Inspirasi', path: '/dashboard/posts/inspirations', icon: FileText },
  { name: 'Kelola Opini', path: '/dashboard/posts/opinions', icon: FileText },
  { name: 'Kelola Organisasi', path: '/dashboard/organizations', icon: Users },
  { name: 'Kelola Infografis', path: '/dashboard/infographics', icon: BarChart3 },
  { name: 'Kelola Pengguna', path: '/dashboard/users', icon: UserCog },
  { name: 'Pengaduan PMI', path: '/dashboard/complaints', icon: MessageSquare },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavItems = () => (
    <>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {ADMIN_NAV.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
              location.pathname === item.path ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {(!collapsed || mobileOpen) && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-2 border-t space-y-1">
        <Link
          to="/"
          className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
        >
          <Home className="h-5 w-5 shrink-0" />
          {(!collapsed || mobileOpen) && <span>Ke Website Utama</span>}
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start space-x-3 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => { signOut(); navigate('/'); }}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {(!collapsed || mobileOpen) && <span>Keluar</span>}
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className="h-16 flex items-center justify-between px-4 border-b">
          {!collapsed && <span className="font-bold text-primary">ADMIN PANEL</span>}
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        <NavItems />
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-background border-b flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar Toggle */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 flex flex-col">
                <div className="h-16 flex items-center px-6 border-b">
                  <span className="font-bold text-primary italic">ADMIN PANEL</span>
                </div>
                <NavItems />
              </SheetContent>
            </Sheet>
            <h1 className="text-sm md:text-xl font-semibold line-clamp-1">
              {ADMIN_NAV.find(n => n.path === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center space-x-4 shrink-0">
            <span className="text-sm font-medium hidden sm:block">{(profile as any)?.email}</span>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs">
              {(profile as any)?.email?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
