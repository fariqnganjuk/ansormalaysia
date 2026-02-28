import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/db';
import type { Post } from '@/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, Users, Info, Flame } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function Home() {
  const [featuredNews, setFeaturedNews] = useState<Post[]>([]);
  const [activities, setActivities] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [news, acts] = await Promise.all([
          api.posts.list({ type: 'pmi_news', limit: 3 }),
          api.posts.list({ type: 'activity', limit: 4 })
        ]);
        setFeaturedNews(news);
        setActivities(acts);
      } catch (err) {
        console.error('Failed to fetch home data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-14 pb-14">
      {/* Hero Section */}
      <section className="relative h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/uploads/1772313452-af896b001728.jpeg"
            alt="Kuala Lumpur"
            className="w-full h-full object-cover brightness-50"
          />
        </div>
        <div className="container relative z-10 px-4 text-center text-white space-y-6">
          <Badge className="bg-secondary text-secondary-foreground mb-4">PCINU Malaysia</Badge>
          <h1 className="text-4xl md:text-6xl font-bold max-w-4xl mx-auto leading-tight">
            Bersama Melindungi & Memberdayakan Pekerja Migran Indonesia
          </h1>
          <p className="text-xl max-w-2xl mx-auto text-white/80">
            Platform advokasi, informasi, dan silaturahmi Nahdliyin di Malaysia. Berkhidmat untuk kemanusiaan dan keutuhan NKRI.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold px-8">
              <Link to="/advokasi">Laporkan Masalah PMI</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm border-white hover:bg-white/20">
              <Link to="/berita" className="text-white hover:text-white">Lihat Berita Terkini</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured News */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold border-l-4 border-primary pl-4">Berita PMI Terkini</h2>
          <Button asChild variant="link">
            <Link to="/berita">Lihat Semua <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse bg-muted h-[400px]" />
            ))
          ) : featuredNews.length > 0 ? (
            featuredNews.map((post) => (
              <Card key={post.id} className="overflow-hidden flex h-full flex-col hover:shadow-lg transition-shadow">
                <div className="aspect-video overflow-hidden bg-muted/40 p-2">
                  <img src={post.image_url || 'https://via.placeholder.com/400x225'} alt={post.title} className="w-full h-full object-contain" />
                </div>
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{post.category}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(post.published_at || post.created_at)}</span>
                  </div>
                  <CardTitle className="line-clamp-2 hover:text-primary transition-colors">
                    <Link to={`/post/${post.slug}`}>{post.title}</Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button asChild variant="ghost" className="w-full text-primary">
                    <Link to={`/post/${post.slug}`}>Baca Selengkapnya</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="md:col-span-3 rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              Belum ada berita utama untuk ditampilkan.
            </div>
          )}
        </div>
      </section>

      {/* Breaking Issues */}
      <section className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-5">
          <Flame className="h-5 w-5 text-destructive" />
          <h2 className="text-2xl md:text-3xl font-bold">Breaking / Isu Hangat PMI</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(loading ? [] : featuredNews).slice(0, 3).map((post) => (
            <Link
              key={`breaking-${post.id}`}
              to={`/post/${post.slug}`}
              className="rounded-xl border bg-card p-4 min-h-[110px] hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary mb-1">Isu Hangat</p>
              <p className="text-sm font-semibold line-clamp-2">{post.title}</p>
            </Link>
          ))}
          {!loading && featuredNews.length === 0 && (
            <div className="md:col-span-3 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Belum ada isu hangat yang dipublikasikan.
            </div>
          )}
        </div>
      </section>

      {/* Activities Section */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold border-l-4 border-primary pl-4">Kegiatan Banom & Organisasi</h2>
          <Button asChild variant="link">
            <Link to="/kegiatan">Semua Kegiatan <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array(4).fill(0).map((_, i) => <Card key={i} className="animate-pulse bg-muted h-[300px]" />)
          ) : activities.length > 0 ? (
            activities.map((act) => (
              <Card key={act.id} className="group overflow-hidden h-full">
                <div className="aspect-video overflow-hidden bg-muted/40 p-2">
                  <img src={act.image_url || 'https://via.placeholder.com/400x225'} alt={act.title} className="w-full h-full object-contain transition-transform" />
                </div>
                <CardHeader className="p-4 space-y-2">
                  <span className="text-xs text-primary font-bold">{act.category}</span>
                  <CardTitle className="text-sm line-clamp-2 leading-snug">
                    <Link to={`/post/${act.slug}`} className="hover:text-primary transition-colors">{act.title}</Link>
                  </CardTitle>
                </CardHeader>
              </Card>
            ))
          ) : (
            <div className="sm:col-span-2 lg:col-span-4 rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              Belum ada highlight kegiatan NU dan Banom.
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center text-white space-y-8">
          <h2 className="text-3xl font-bold">Butuh Bantuan atau Ingin Berkolaborasi?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center space-y-4 p-6 bg-white/10 rounded-xl backdrop-blur-sm">
              <Shield className="h-12 w-12 text-secondary" />
              <h3 className="text-xl font-bold">Layanan Advokasi</h3>
              <p className="text-sm text-white/70">Pendampingan hukum dan konsultasi masalah ketenagakerjaan bagi PMI.</p>
              <Button asChild variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                <Link to="/advokasi">Klik Bantuan</Link>
              </Button>
            </div>
            <div className="flex flex-col items-center space-y-4 p-6 bg-white/10 rounded-xl backdrop-blur-sm">
              <Users className="h-12 w-12 text-secondary" />
              <h3 className="text-xl font-bold">Keanggotaan</h3>
              <p className="text-sm text-white/70">Bergabung dengan komunitas Nahdliyin di Malaysia dan ikuti kegiatannya.</p>
              <Button asChild variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                <Link to="/kontak">Hubungi Kami</Link>
              </Button>
            </div>
            <div className="flex flex-col items-center space-y-4 p-6 bg-white/10 rounded-xl backdrop-blur-sm">
              <Info className="h-12 w-12 text-secondary" />
              <h3 className="text-xl font-bold">Informasi Kebijakan</h3>
              <p className="text-sm text-white/70">Dapatkan update peraturan terbaru dari KBRI dan Pemerintah Malaysia.</p>
              <Button asChild variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                <Link to="/berita">Baca Update</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
