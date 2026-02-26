import { useEffect, useState } from 'react';
import { api } from '@/db/api';
import type { Infographic } from '@/db/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Share2, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DataInfographics() {
  const [infographics, setInfographics] = useState<Infographic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.infographics.list();
        setInfographics(data);
      } catch (err) {
        console.error('Failed to fetch infographics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 pb-24 max-w-6xl space-y-12">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl font-bold text-primary">Data & Infografis PMI</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Visualisasi data dan statistik mengenai kondisi Pekerja Migran Indonesia di Malaysia, tren pengaduan, dan sebaran geografis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {loading ? (
          Array(2).fill(0).map((_, i) => <Card key={i} className="animate-pulse bg-muted h-[400px]" />)
        ) : infographics.map((info) => (
          <Card key={info.id} className="overflow-hidden shadow-lg border-primary/10">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-2xl font-bold">{info.title}</CardTitle>
              <CardDescription className="line-clamp-2 italic">{info.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full aspect-video bg-muted overflow-hidden">
                <img src={info.image_url} alt={info.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer" onClick={() => window.open(info.image_url, '_blank')} />
              </div>
            </CardContent>
            <div className="p-4 bg-background flex items-center justify-between border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                <Info className="h-4 w-4" /> Sumber Data Terverifikasi
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={info.image_url} download target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" /> Download
                  </a>
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {infographics.length === 0 && !loading && (
        <div className="py-20 text-center text-muted-foreground border-2 border-dashed rounded-xl">
          Belum ada data infografis yang tersedia saat ini.
        </div>
      )}

      <div className="p-8 bg-muted/50 rounded-2xl border flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 space-y-4">
          <h2 className="text-2xl font-bold text-primary">Bagi Peneliti & Akademisi</h2>
          <p className="text-muted-foreground">
            NU Malaysia menyediakan data statistik sekunder untuk keperluan riset dan kebijakan perlindungan PMI. Silakan hubungi tim data kami untuk permohonan akses data lebih mendalam.
          </p>
          <Button variant="outline" asChild>
            <Link to="/kontak">Hubungi Tim Data</Link>
          </Button>
        </div>
        <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
          <Info className="h-16 w-16 text-primary" />
        </div>
      </div>
    </div>
  );
}
