import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronDown, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const NAV_ITEMS = [
  { name: 'Beranda', path: '/' },
  { name: 'Berita', path: '/berita' },
  { name: 'Organisasi', path: '/organisasi' },
  { name: 'Kegiatan', path: '/kegiatan' },
  { name: 'Inspirasi', path: '/inspirasi' },
  { name: 'Opini', path: '/opini' },
  { name: 'Advokasi', path: '/advokasi' },
  { name: 'Data', path: '/data' },
  { name: 'Tentang', path: '/tentang' },
  { name: 'Kontak', path: '/kontak' },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen font-sans">
      {/* Top Banner */}
      <div className="bg-primary text-primary-foreground py-1 text-xs text-center">
        PCINU Malaysia - Media Informasi & Advokasi Pekerja Migran Indonesia
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
              NU
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-lg text-primary uppercase">NU Malaysia</span>
              <span className="text-[10px] text-muted-foreground uppercase">Media & Advokasi PMI</span>
            </div>
          </Link>

          {/* Desktop Navigation - Scrollable */}
          <ScrollArea className="hidden md:block max-w-2xl">
            <nav className="flex items-center space-x-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-3 py-2 text-sm font-medium transition-colors hover:text-primary whitespace-nowrap ${
                      isActive ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </nav>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>

          <div className="flex items-center space-x-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    Dashboard Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="ghost" size="icon" className="hidden md:flex h-8 w-8">
                <Link to="/login">
                  <LogIn className="h-5 w-5" />
                </Link>
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col space-y-4 mt-8">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className="text-lg font-medium hover:text-primary transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                  <hr />
                  {user ? (
                    <>
                      <Link to="/dashboard" onClick={() => setIsOpen(false)} className="text-lg font-medium">Dashboard</Link>
                      <Button onClick={() => { signOut(); setIsOpen(false); }} variant="outline" className="justify-start">Keluar</Button>
                    </>
                  ) : (
                    <Link to="/login" onClick={() => setIsOpen(false)} className="text-lg font-medium">Masuk</Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-muted/30">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary font-bold text-xl">
                  NU
                </div>
                <span className="font-bold text-lg">NU Malaysia</span>
              </div>
              <p className="text-sm text-primary-foreground/70 mb-4">
                Media informasi dan advokasi independen untuk Nahdliyin dan Pekerja Migran Indonesia di Malaysia.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Tautan Cepat</h3>
              <ul className="space-y-2 text-sm text-primary-foreground/70">
                <li><Link to="/berita">Berita PMI</Link></li>
                <li><Link to="/advokasi">Layanan Pengaduan</Link></li>
                <li><Link to="/kegiatan">Kegiatan Banom</Link></li>
                <li><Link to="/organisasi">Tentang PCINU</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Layanan</h3>
              <ul className="space-y-2 text-sm text-primary-foreground/70">
                <li>Bantuan Hukum</li>
                <li>Informasi Dokumen</li>
                <li>Konsultasi Ketenagakerjaan</li>
                <li>Pendampingan Kasus</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Kontak</h3>
              <p className="text-sm text-primary-foreground/70">
                Email: info@nu-malaysia.org<br />
                Kuala Lumpur, Malaysia
              </p>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/50">
            © 2026 NU Malaysia Media & PMI Advocacy. Seluruh hak cipta dilindungi.
          </div>
        </div>
      </footer>
    </div>
  );
}
