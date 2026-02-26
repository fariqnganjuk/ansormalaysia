import { useEffect, useState } from 'react';
import { api } from '@/db';
import type { Post, Complaint } from '@/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, MessageSquare, Users, TrendingUp, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export default function Dashboard() {
  const [stats, setStats] = useState({
    posts: 0,
    complaints: 0,
    organizations: 0
  });
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [posts, complaints, orgs] = await Promise.all([
          api.posts.list({ limit: 100, publishedOnly: false }),
          api.complaints.list(),
          api.organizations.list()
        ]);
        setStats({
          posts: posts.length,
          complaints: complaints.length,
          organizations: orgs.length
        });
        setRecentComplaints(complaints.slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Halo, Administrator!</h1>
          <p className="text-muted-foreground">Ini adalah ringkasan aktivitas konten dan pengaduan PMI di website NU Malaysia.</p>
        </div>
        <div className="flex gap-4">
          <Button asChild className="bg-primary text-white hover:bg-primary/90">
            <Link to="/dashboard/posts"><FileText className="mr-2 h-4 w-4" /> Tambah Konten</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/"><ArrowRight className="mr-2 h-4 w-4" /> Lihat Website Utama</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Konten/Berita</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.posts}</div>
            <p className="text-xs text-muted-foreground italic flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" /> Termasuk draf & dipublikasikan
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-accent shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pengaduan PMI</CardTitle>
            <MessageSquare className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.complaints}</div>
            <p className="text-xs text-muted-foreground italic flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" /> Memerlukan respon cepat
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-600 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Struktur Banom</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.organizations}</div>
            <p className="text-xs text-muted-foreground italic flex items-center gap-1 mt-1">
              <ShieldCheck className="h-3 w-3" /> Terdaftar dalam sistem
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Complaints */}
        <Card className="shadow-lg border-primary/5">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Pengaduan Terbaru
            </CardTitle>
            <CardDescription>Lima pengaduan terakhir yang masuk melalui website.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center animate-pulse text-muted-foreground">Memuat data...</div>
            ) : recentComplaints.length > 0 ? (
              <div className="divide-y">
                {recentComplaints.map((comp) => (
                  <div key={comp.id} className="p-4 hover:bg-muted/30 transition-colors flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="font-bold text-sm">{comp.name}</div>
                      <p className="text-xs text-muted-foreground line-clamp-1 italic">"{comp.issue}"</p>
                      <div className="text-[10px] text-muted-foreground">{formatDate(comp.created_at)}</div>
                    </div>
                    <Badge variant={comp.status === 'pending' ? 'destructive' : comp.status === 'in_progress' ? 'secondary' : 'default'} className="text-[10px] uppercase">
                      {comp.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">Belum ada pengaduan masuk.</div>
            )}
          </CardContent>
          <div className="p-4 border-t text-center">
            <Button asChild variant="ghost" size="sm" className="w-full font-bold">
              <Link to="/dashboard/complaints">Lihat Semua Pengaduan <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </Card>

        {/* Quick Actions & Maintenance */}
        <div className="space-y-8">
          <Card className="shadow-lg border-primary/5">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle>Panduan Pengelola Konten</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <h4 className="font-bold text-sm uppercase tracking-wider text-primary flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span> Gambar & Media
                </h4>
                <p className="text-xs text-muted-foreground">Gunakan gambar resolusi tinggi (maks 1MB). Sistem akan mengompresi gambar secara otomatis demi performa website.</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-bold text-sm uppercase tracking-wider text-primary flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span> Etika Penulisan
                </h4>
                <p className="text-xs text-muted-foreground">Pastikan informasi berita valid dan terverifikasi. Gunakan bahasa yang sopan dan mendukung persaudaraan Nahdliyin.</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-bold text-sm uppercase tracking-wider text-primary flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span> Keamanan Data PMI
                </h4>
                <p className="text-xs text-muted-foreground italic text-amber-700 font-medium">Dilarang mempublikasikan identitas lengkap pelapor (nama asli, paspor, alamat spesifik) demi keamanan pelapor.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
