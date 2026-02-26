import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Globe, MessageSquare, HandHelping, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function Contact() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Pesan Anda telah dikirim! Tim redaksi akan segera membalasnya.');
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="container mx-auto px-4 py-12 pb-24 max-w-6xl space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary">Kontak & Kolaborasi</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Terhubung dengan kami untuk informasi lebih lanjut, kiriman tulisan, kerjasama media, atau dukungan kemanusiaan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Contact Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-l-4 border-primary">
            <CardHeader>
              <CardTitle className="text-xl">Informasi Redaksi</CardTitle>
              <CardDescription>Hubungi tim kami di Kuala Lumpur</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-sm">Alamat Kantor</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Pusat Informasi PCINU Malaysia<br />
                    Kuala Lumpur, Malaysia
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors">
                <Mail className="h-5 w-5 text-primary shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-sm">Email Umum</h4>
                  <p className="text-sm text-muted-foreground">info@nu-malaysia.org</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors">
                <Phone className="h-5 w-5 text-primary shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-sm">WhatsApp</h4>
                  <p className="text-sm text-muted-foreground">+60 123 456 789</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors">
                <Globe className="h-5 w-5 text-primary shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-sm">Media Sosial</h4>
                  <p className="text-sm text-muted-foreground">@pcinumalaysia (FB/IG)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground border-none overflow-hidden relative shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><HandHelping className="h-6 w-6" /> Donasi & Dukungan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-primary-foreground/80 leading-relaxed">
                Dukungan Anda membantu kami menjalankan program advokasi PMI secara gratis dan berkelanjutan.
              </p>
              <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold">Informasi Donasi</Button>
            </CardContent>
          </Card>
        </div>

        {/* Center: Collaboration Form */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-primary/10">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle>Kirim Pesan atau Artikel</CardTitle>
              <CardDescription>
                Punya masukan, ingin mengirim opini, atau kolaborasi program? Silakan isi formulir di bawah ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nama Lengkap</label>
                  <Input placeholder="Nama Anda" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email / WhatsApp</label>
                  <Input placeholder="Kontak Anda" required />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium">Subjek</label>
                  <Input placeholder="Judul pesan / tujuan kontak" required />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium">Pesan</label>
                  <Textarea placeholder="Tuliskan pesan Anda secara detail..." className="min-h-[200px] resize-none" required />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" size="lg" className="w-full font-bold h-12">Kirim Sekarang</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Collaboration Opportunities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <div className="flex items-start gap-4 p-6 bg-white rounded-xl border shadow-sm">
              <Users className="h-8 w-8 text-primary shrink-0" />
              <div>
                <h4 className="font-bold">Kemitraan Media</h4>
                <p className="text-sm text-muted-foreground">Kami terbuka untuk kerjasama pemberitaan dan pertukaran konten terkait migrasi.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 bg-white rounded-xl border shadow-sm">
              <MessageSquare className="h-8 w-8 text-primary shrink-0" />
              <div>
                <h4 className="font-bold">Kirim Tulisan</h4>
                <p className="text-sm text-muted-foreground">Kirimkan opini, esai, atau cerita inspiratif Anda untuk diterbitkan di website kami.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="rounded-2xl overflow-hidden border-2 border-muted h-[400px] shadow-lg grayscale hover:grayscale-0 transition-all duration-500 relative">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          src="https://www.google.com/maps/embed/v1/place?key=AIzaSyB_LJOYJL-84SMuxNB7LtRGhxEQLjswvy0&q=Kuala+Lumpur,Malaysia&language=id&region=my"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}
