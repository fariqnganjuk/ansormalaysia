import { useEffect, useState } from 'react';
import { api } from '@/db/api';
import type { Organization, Post } from '@/db/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function OrganizationInfo() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.organizations.list();
        setOrgs(data);
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
