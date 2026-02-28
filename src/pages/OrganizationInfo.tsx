import { useEffect, useState } from 'react';
import { api } from '@/db';
import type { Organization, Post } from '@/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

export default function OrganizationInfo() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [activityReleases, setActivityReleases] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [orgData, activityData] = await Promise.all([
          api.organizations.list(),
          api.posts.list({ type: 'activity', limit: 6 }),
        ]);
        setOrgs(orgData);
        setActivityReleases(activityData);
      } catch (err) {
        console.error('Failed to fetch orgs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const pcinu = orgs.filter(o => o.type === 'PCINU');
  const banom = orgs.filter(o => o.type === 'Banom');

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="text-center mb-16 space-y-4">
        <Badge variant="outline">Profil Organisasi Nahdliyin Malaysia</Badge>
        <h1 className="text-4xl font-bold text-primary">Struktur & Badan Otonom</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Mengenal Pengurus Cabang Istimewa Nahdlatul Ulama (PCINU) Malaysia dan berbagai Badan Otonom (Banom) yang ada.
        </p>
      </div>

      <section className="mb-20">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-3xl font-bold text-primary shrink-0">Induk Organisasi (PCINU)</h2>
          <Separator className="flex-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {loading ? (
            Array(2).fill(0).map((_, i) => <Card key={i} className="animate-pulse bg-muted h-[200px]" />)
          ) : pcinu.map((org) => (
            <Card key={org.id} className="border-l-4 border-primary">
              <CardHeader className="flex flex-row items-center gap-6">
                <div className="w-20 h-20 bg-muted rounded-full overflow-hidden shrink-0 flex items-center justify-center p-2 border">
                  <img src={org.logo_url || 'https://via.placeholder.com/80'} alt={org.name} className="w-full h-full object-contain" />
                </div>
                <div className="space-y-1">
                  <Badge variant="outline">PCINU Malaysia</Badge>
                  <CardTitle className="text-2xl text-primary">{org.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{org.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-3xl font-bold text-primary shrink-0">Badan Otonom (Banom)</h2>
          <Separator className="flex-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loading ? (
            Array(3).fill(0).map((_, i) => <Card key={i} className="animate-pulse bg-muted h-[250px]" />)
          ) : banom.map((org) => (
            <Card key={org.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full overflow-hidden mx-auto mb-4 flex items-center justify-center p-2 border shadow-inner">
                  <img src={org.logo_url || 'https://via.placeholder.com/80'} alt={org.name} className="w-full h-full object-contain" />
                </div>
                <CardTitle className="text-xl">{org.name}</CardTitle>
                <Badge variant="secondary">Banom</Badge>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground line-clamp-4">{org.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-3xl font-bold text-primary shrink-0">Rilis Kegiatan Terbaru</h2>
          <Separator className="flex-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            Array(4).fill(0).map((_, i) => <Card key={i} className="animate-pulse bg-muted h-[180px]" />)
          ) : activityReleases.length > 0 ? (
            activityReleases.slice(0, 4).map((post) => (
              <Card key={post.id} className="overflow-hidden border-l-4 border-primary/40">
                <CardContent className="p-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-24 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                      <img src={post.image_url || 'https://via.placeholder.com/240x160'} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-2 min-w-0">
                      <p className="text-[11px] uppercase tracking-wide font-semibold text-primary">{post.category || 'Kegiatan Banom'}</p>
                      <h3 className="text-sm font-semibold line-clamp-2">{post.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{post.excerpt || 'Rilis kegiatan organisasi dan relawan NU Malaysia.'}</p>
                      <p className="text-[11px] text-muted-foreground">{formatDate(post.published_at || post.created_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="md:col-span-2 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Belum ada rilis kegiatan terbaru.
            </div>
          )}
        </div>
      </section>

      <div className="mt-20 p-12 bg-primary rounded-3xl text-white text-center space-y-6 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mb-32"></div>
        <h2 className="text-3xl font-bold relative z-10">Ingin Bergabung atau Bertanya?</h2>
        <p className="text-white/80 max-w-2xl mx-auto relative z-10">
          Silakan hubungi perwakilan masing-masing Banom atau kontak umum PCINU Malaysia untuk informasi lebih lanjut.
        </p>
        <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold relative z-10">
          <Link to="/kontak">Hubungi Kami</Link>
        </Button>
      </div>
    </div>
  );
}
