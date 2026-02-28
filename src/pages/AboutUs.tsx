import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Target, Flag, Shield, Info, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const missionPoints = [
  'Memberikan ruang bagi suara PMI untuk menyampaikan aspirasi, pengalaman, dan kebutuhan mereka secara terbuka.',
  'Menyebarkan informasi akurat dan edukatif terkait hak, kewajiban, prosedur, serta kebijakan pemerintah bagi PMI di luar negeri.',
  'Mengedukasi dan meningkatkan kesadaran tentang perlindungan hukum, kesehatan, keselamatan kerja, dan literasi keuangan bagi PMI.',
  'Mendorong pemberdayaan komunitas PMI melalui program media interaktif, pelatihan digital, dan kolaborasi dengan organisasi sosial dan pemerintah.',
  'Menjadi jembatan komunikasi antara PMI, keluarga di tanah air, organisasi sosial, dan pihak terkait di negara penempatan.',
];

const independentMediaPoints = [
  {
    title: 'Objektif dan tanpa bias',
    description: 'Menyuarakan aspirasi dan pengalaman PMI secara objektif, akurat, dan tanpa bias.',
  },
  {
    title: 'Informasi tepercaya',
    description: 'Memberikan informasi yang dapat dipercaya terkait hak, regulasi, dan peluang bagi PMI, termasuk edukasi sosial, hukum, dan ekonomi.',
  },
  {
    title: 'Wadah kolaborasi',
    description: 'Menjadi wadah kolaborasi antar komunitas PMI, organisasi sosial, dan pihak terkait, tanpa intervensi politik atau kepentingan pihak ketiga.',
  },
  {
    title: 'Etik dan transparansi',
    description: 'Mengedepankan profesionalisme jurnalistik, kode etik, dan transparansi dalam seluruh publikasi dan konten.',
  },
];

export default function AboutUs() {
  const [activeIndependentPoint, setActiveIndependentPoint] = useState(0);

  return (
    <div className="container mx-auto px-4 py-12 pb-24 max-w-5xl space-y-20">
      {/* Introduction */}
      <section className="text-center space-y-6">
        <Badge className="bg-primary text-primary-foreground mb-4">Tentang NU Malaysia</Badge>
        <h1 className="text-4xl md:text-6xl font-extrabold text-primary leading-tight">Mengenal Media & Advokasi NU Malaysia</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed italic border-l-8 border-accent pl-8 py-4">
          "Bukan sekadar berita, tetapi juga wadah aspirasi, informasi, dan edukasi bagi PMI Indonesia di luar negeri."
        </p>
      </section>

      {/* Vision & Mission */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <Card className="border-t-4 border-primary shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Target className="h-24 w-24" />
          </div>
          <CardContent className="p-8 space-y-4 relative z-10">
            <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-primary">Visi Kami</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Menjadi media terpercaya bagi Pekerja Migran Indonesia (PMI) di luar negeri, sebagai wadah aspirasi, informasi, dan edukasi, sehingga suara PMI terdengar, hak-hak mereka terlindungi, dan kesejahteraan mereka meningkat.
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-accent shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Flag className="h-24 w-24" />
          </div>
          <CardContent className="p-8 space-y-4 relative z-10">
            <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Flag className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-3xl font-bold text-primary">Misi Kami</h2>
            <ul className="space-y-3 text-muted-foreground list-none pl-0 text-lg">
              {missionPoints.map((point, index) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-accent/15 px-1.5 text-sm font-semibold text-accent">{index + 1}</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Core Identity */}
      <section className="bg-muted/50 rounded-3xl p-12 space-y-12 border shadow-inner">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-primary flex items-center justify-center gap-3">
            <Shield className="h-8 w-8 text-primary" /> Posisi Media (Independen)
          </h2>
          <Separator className="w-24 mx-auto bg-accent h-1" />
          <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Media ini berposisi independen dan netral, tidak terikat pada kepentingan politik atau komersial manapun, serta mengutamakan kepentingan PMI sebagai prioritas utama.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {independentMediaPoints.map((point, index) => {
            const isActive = activeIndependentPoint === index;
            return (
              <button
                type="button"
                key={point.title}
                onClick={() => setActiveIndependentPoint(index)}
                className={`text-left rounded-xl border p-5 transition-all ${isActive ? 'border-primary bg-primary/10 shadow-sm' : 'bg-background hover:bg-background/80'}`}
              >
                <div className="mb-2 flex items-center gap-3">
                  <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>{index + 1}</span>
                  <h3 className="font-semibold text-lg text-primary">{point.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{point.description}</p>
              </button>
            );
          })}
        </div>

        <Card className="border border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <p className="text-sm md:text-base text-foreground leading-relaxed">
              Dengan posisi ini, media berkomitmen untuk menjadi suara PMI yang kredibel, amanah, dan bermanfaat bagi komunitas di dalam maupun luar negeri.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Philosophy */}
      <section className="flex flex-col md:flex-row gap-12 items-center">
        <div className="flex-1 space-y-6">
          <h2 className="text-3xl font-bold text-primary">Kenapa Kami Ada?</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Jumlah Pekerja Migran Indonesia (PMI) di luar negeri sangat besar, namun akses informasi, perlindungan hukum, dan ruang aspirasi sering kali masih terbatas. Karena itu, media ini hadir sebagai jembatan komunikasi dan edukasi yang berpihak pada PMI.
          </p>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Melalui media ini, kami ingin memastikan suara PMI lebih didengar, informasi penting lebih mudah diakses, dan dukungan sosial-hukum lebih terhubung secara cepat dan tepat.
          </p>
        </div>
        <div className="flex-1 w-full aspect-square bg-primary/10 rounded-3xl flex items-center justify-center border-2 border-primary/20 p-12">
          <div className="text-center space-y-4">
            <Heart className="h-32 w-32 text-primary mx-auto animate-pulse" />
            <span className="text-2xl font-bold text-primary uppercase tracking-widest">Berkhidmat untuk NU</span>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="p-8 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4">
        <Info className="h-6 w-6 text-amber-600 shrink-0 mt-1" />
        <div className="space-y-2">
          <h4 className="font-bold text-amber-900 uppercase text-xs tracking-wider">Pernyataan Penting (Disclaimer)</h4>
          <p className="text-sm text-amber-800 leading-relaxed italic">
            Seluruh konten yang disajikan dalam website ini adalah tanggung jawab tim redaksi NU Malaysia Media. Kami berusaha menyajikan data yang akurat, namun tidak bertanggung jawab atas kerugian hukum atau materiil yang timbul dari penyalahgunaan informasi di luar konteks yang diberikan. Layanan advokasi kami dilakukan atas dasar sukarela dan kemanusiaan.
          </p>
          <p className="text-sm text-amber-800 leading-relaxed italic">
            Website ini adalah media independen komunitas dan bukan media struktural resmi PBNU maupun PCINU.
          </p>
        </div>
      </div>
    </div>
  );
}
