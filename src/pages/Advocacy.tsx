import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/db';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Shield, CheckCircle2, AlertCircle, Phone, Mail, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { sanitizeInput, validateEmail, validatePhone, rateLimiter } from '@/lib/security';

const formSchema = z.object({
  name: z.string()
    .min(2, { message: 'Nama harus minimal 2 karakter.' })
    .max(100, { message: 'Nama terlalu panjang.' })
    .regex(/^[a-zA-Z\s.'-]+$/, { message: 'Nama hanya boleh berisi huruf dan spasi.' }),
  contact: z.string()
    .min(5, { message: 'Kontak (HP/Email) harus valid.' })
    .max(100, { message: 'Kontak terlalu panjang.' }),
  issue: z.string()
    .min(10, { message: 'Masalah harus dijelaskan minimal 10 karakter.' })
    .max(2000, { message: 'Deskripsi masalah terlalu panjang (maksimal 2000 karakter).' }),
});

export default function Advocacy() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      contact: '',
      issue: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Rate limiting check
    if (!rateLimiter.canAttempt('complaint-form', 3, 60000)) {
      toast.error('Terlalu banyak percobaan. Silakan tunggu sebentar.');
      return;
    }

    // Validate contact (email or phone)
    const isEmail = values.contact.includes('@');
    const isPhone = /^[0-9+\s-]+$/.test(values.contact);
    
    if (isEmail && !validateEmail(values.contact)) {
      toast.error('Format email tidak valid.');
      return;
    }
    
    if (isPhone && !validatePhone(values.contact.replace(/[\s-]/g, ''))) {
      toast.error('Format nomor telepon tidak valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Sanitize inputs before sending
      const sanitizedData = {
        name: sanitizeInput(values.name),
        contact: sanitizeInput(values.contact),
        issue: sanitizeInput(values.issue),
      };

      await api.complaints.create(sanitizedData);
      setIsSuccess(true);
      toast.success('Pengaduan berhasil dikirim! Tim kami akan segera menghubungi Anda.');
      form.reset();
      rateLimiter.reset('complaint-form');
    } catch (err) {
      console.error('Failed to submit complaint:', err);
      toast.error('Gagal mengirim pengaduan. Silakan coba lagi nanti.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 pb-24 max-w-5xl">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl font-bold text-primary leading-tight">Advokasi & Pengaduan Layanan PMI</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Kami hadir untuk memberikan bantuan hukum, perlindungan, dan pendampingan bagi Pekerja Migran Indonesia di Malaysia.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left: Info & Workflow */}
        <div className="space-y-8">
          <Card className="border-l-4 border-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-accent" /> Hak Anda Dilindungi
              </CardTitle>
              <CardDescription>Pahami hak-hak Anda sebagai pekerja migran yang legal dan bermartabat.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Tim Advokasi NU Malaysia bekerja sama dengan berbagai pihak untuk menangani kasus:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Gaji tidak dibayar atau tidak sesuai kontrak</li>
                <li>Tindakan kekerasan fisik atau verbal</li>
                <li>Penahanan dokumen (Paspor/Permit)</li>
                <li>Masalah keimigrasian dan hukum</li>
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <h3 className="text-xl font-bold border-b pb-2">Alur Penanganan Kasus</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-primary text-white h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <h4 className="font-bold">Laporan Masuk</h4>
                  <p className="text-sm text-muted-foreground">Isi formulir pengaduan dengan data yang benar.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary text-white h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <h4 className="font-bold">Verifikasi Data</h4>
                  <p className="text-sm text-muted-foreground">Tim kami akan menghubungi Anda untuk detail masalah.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary text-white h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                <div>
                  <h4 className="font-bold">Tindakan Advokasi</h4>
                  <p className="text-sm text-muted-foreground">Langkah mediasi atau jalur hukum akan diambil.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">Kontak Darurat</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Phone className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">+60 123 456 789</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">advokasi@nu-malaysia.org</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Complaint Form */}
        <div>
          <Card className="shadow-xl">
            <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
              <CardTitle>Formulir Pengaduan</CardTitle>
              <CardDescription className="text-primary-foreground/70 italic text-xs">
                Data Anda bersifat rahasia dan hanya digunakan untuk keperluan advokasi.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {isSuccess ? (
                <div className="text-center py-12 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">Terima Kasih!</h3>
                    <p className="text-muted-foreground">Pengaduan Anda telah kami terima. Mohon tunggu tim kami menghubungi Anda.</p>
                  </div>
                  <Button onClick={() => setIsSuccess(false)} variant="outline">Kirim Pengaduan Baru</Button>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Lengkap</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama sesuai paspor" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor WhatsApp atau Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Aktif yang bisa dihubungi" {...field} />
                          </FormControl>
                          <FormDescription>Kami akan menghubungi Anda melalui kontak ini.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="issue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deskripsi Masalah</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Ceritakan masalah Anda secara ringkas namun jelas..."
                              className="min-h-[150px] resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="bg-muted p-3 rounded-md flex items-start gap-2 text-[10px] text-muted-foreground leading-tight">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                      <span>
                        Situs ini bukan media struktural PBNU/PCNU. Layanan ini dijalankan oleh tim independen NU Malaysia secara sukarela untuk kepentingan kemanusiaan.
                      </span>
                    </div>
                    <Button type="submit" className="w-full font-bold h-12 text-lg" disabled={isSubmitting}>
                      {isSubmitting ? 'Mengirim...' : 'Kirim Pengaduan Sekarang'}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
