import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Target, Flag, Shield, Info, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AboutUs() {
  return (
    <div className="container mx-auto px-4 py-12 pb-24 max-w-5xl space-y-20">
      {/* Introduction */}
      <section className="text-center space-y-6">
        <Badge className="bg-primary text-primary-foreground mb-4">Tentang NU Malaysia</Badge>
        <h1 className="text-4xl md:text-6xl font-extrabold text-primary leading-tight">Mengenal Media & Advokasi NU Malaysia</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed italic border-l-8 border-accent pl-8 py-4">
          "Bukan sekadar berita, tapi juga pemberdayaan dan perlindungan. Kami hadir untuk Nahdliyin dan seluruh PMI di Malaysia."
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
              Menjadi platform media dan advokasi terpercaya yang memperkuat identitas keislaman moderat (Aswaja) serta melindungi hak-hak Pekerja Migran Indonesia di Malaysia.
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
              <li className="flex items-start gap-3"><Separator orientation="vertical" className="h-6 w-1 bg-accent shrink-0" /> Menyediakan informasi akurat dan edukatif bagi PMI.</li>
              <li className="flex items-start gap-3"><Separator orientation="vertical" className="h-6 w-1 bg-accent shrink-0" /> Melakukan pendampingan hukum dan sosial secara sukarela.</li>
              <li className="flex items-start gap-3"><Separator orientation="vertical" className="h-6 w-1 bg-accent shrink-0" /> Membangun komunitas Nahdliyin yang mandiri di Malaysia.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Core Identity */}
      <section className="bg-muted/50 rounded-3xl p-12 space-y-12 border shadow-inner">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-primary flex items-center justify-center gap-3">
            <Shield className="h-8 w-8 text-primary" /> Identitas & Independensi
          </h2>
          <Separator className="w-24 mx-auto bg-accent h-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4 text-center p-6 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-primary text-white w-10 h-10 rounded-full mx-auto flex items-center justify-center font-bold">1</div>
            <h3 className="font-bold text-xl">Nahdliyin (Aswaja)</h3>
            <p className="text-sm text-muted-foreground">Berlandaskan paham Ahlussunnah wal Jama'ah An-Nahdliyah yang moderat, toleran, dan seimbang.</p>
          </div>
          <div className="space-y-4 text-center p-6 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-primary text-white w-10 h-10 rounded-full mx-auto flex items-center justify-center font-bold">2</div>
            <h3 className="font-bold text-xl">Media Independen</h3>
            <p className="text-sm text-muted-foreground">Situs ini dikelola secara independen oleh tim relawan di Malaysia, bukan media struktural resmi PBNU/PCNU.</p>
          </div>
          <div className="space-y-4 text-center p-6 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-primary text-white w-10 h-10 rounded-full mx-auto flex items-center justify-center font-bold">3</div>
            <h3 className="font-bold text-xl">Berkhidmat untuk Kemanusiaan</h3>
            <p className="text-sm text-muted-foreground">Fokus utama kami adalah kemanusiaan, perlindungan pekerja migran tanpa membedakan latar belakang.</p>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="flex flex-col md:flex-row gap-12 items-center">
        <div className="flex-1 space-y-6">
          <h2 className="text-3xl font-bold text-primary">Kenapa Kami Ada?</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Jumlah Pekerja Migran Indonesia (PMI) di Malaysia sangat besar, namun akses informasi dan perlindungan hukum seringkali sulit didapat. Sebagai bagian dari keluarga besar NU di Malaysia, kami merasa terpanggil untuk menjembatani kesenjangan ini.
          </p>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Melalui media ini, kami berharap suara PMI bisa lebih didengar dan hak-hak mereka bisa lebih terlindungi lewat jalur advokasi yang kami sediakan secara gratis.
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
        </div>
      </div>
    </div>
  );
}
