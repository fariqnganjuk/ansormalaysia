import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api, type ComplaintSubmission } from '@/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, FileUp, Phone, Shield } from 'lucide-react';
import { sanitizeInput, validateEmail, validatePhone } from '@/lib/security';
import { ADVOCACY_VOLUNTEER_CONTACTS } from '@/config/advocacy';

const complaintTypeOptions = [
  'Keterlambatan gaji / pembayaran tidak sesuai',
  'Kondisi kerja tidak aman / tidak layak',
  'Kekerasan / pelecehan / diskriminasi',
  'Masalah dokumen (paspor, visa, kontrak)',
  'Kesehatan / akses medis',
] as const;

const formSchema = z.object({
  full_name: z.string().min(2, 'Nama lengkap wajib diisi').max(190, 'Nama terlalu panjang'),
  id_number: z.string().min(3, 'Nomor KTP/Paspor wajib diisi').max(120, 'Terlalu panjang'),
  birth_date: z.string().min(1, 'Tanggal lahir wajib diisi'),
  malaysia_address: z.string().min(5, 'Alamat di Malaysia wajib diisi').max(1500, 'Alamat terlalu panjang'),
  phone_whatsapp: z.string().min(8, 'Nomor telepon/WhatsApp wajib diisi').max(50, 'Nomor terlalu panjang'),
  email: z.string().max(190, 'Email terlalu panjang').default(''),
  employer_name: z.string().min(2, 'Nama perusahaan/majikan wajib diisi').max(190, 'Terlalu panjang'),
  employer_address: z.string().min(5, 'Alamat/lokasi kerja wajib diisi').max(1500, 'Terlalu panjang'),
  job_type: z.string().min(2, 'Jenis pekerjaan wajib diisi').max(190, 'Terlalu panjang'),
  work_duration: z.string().min(2, 'Lama bekerja wajib diisi').max(120, 'Terlalu panjang'),
  complaint_types: z.array(z.string()).default([]),
  complaint_other: z.string().max(2000, 'Keterangan tambahan terlalu panjang').default(''),
  chronology: z.string().min(20, 'Kronologi minimal 20 karakter').max(10000, 'Kronologi terlalu panjang'),
  evidence_url: z.string().max(500, 'URL bukti terlalu panjang').default(''),
  requested_action: z.string().min(10, 'Tindakan yang diinginkan wajib diisi').max(5000, 'Terlalu panjang'),
  declaration_name: z.string().min(2, 'Nama pengadu wajib diisi').max(190, 'Terlalu panjang'),
  declaration_date: z.string().min(1, 'Tanggal pernyataan wajib diisi'),
  declaration_signature: z.string().min(2, 'Tanda tangan (nama) wajib diisi').max(190, 'Terlalu panjang'),
  declaration_agreed: z.boolean().refine((value) => value, {
    message: 'Anda harus menyetujui pernyataan.',
  }),
});

type FormValues = z.infer<typeof formSchema>;
const ADVOCACY_DRAFT_KEY = 'advocacy_complaint_draft_v1';
const ADVOCACY_STEP_KEY = 'advocacy_complaint_step_v1';

export default function Advocacy() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<any>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      full_name: '',
      id_number: '',
      birth_date: '',
      malaysia_address: '',
      phone_whatsapp: '',
      email: '',
      employer_name: '',
      employer_address: '',
      job_type: '',
      work_duration: '',
      complaint_types: [],
      complaint_other: '',
      chronology: '',
      evidence_url: '',
      requested_action: '',
      declaration_name: '',
      declaration_date: '',
      declaration_signature: '',
      declaration_agreed: false,
    },
  });

  const steps = useMemo(
    () => [
      {
        title: 'Data Pengadu',
        description: 'Isi identitas pelapor secara lengkap.',
        fields: ['full_name', 'id_number', 'birth_date', 'malaysia_address', 'phone_whatsapp', 'email'],
      },
      {
        title: 'Data Tempat Kerja / Majikan',
        description: 'Masukkan informasi perusahaan atau majikan.',
        fields: ['employer_name', 'employer_address', 'job_type', 'work_duration'],
      },
      {
        title: 'Jenis Pengaduan',
        description: 'Pilih jenis masalah yang dialami.',
        fields: ['complaint_types', 'complaint_other'],
      },
      {
        title: 'Kronologi Pengaduan',
        description: 'Tuliskan kronologi secara jelas dan runtut.',
        fields: ['chronology'],
      },
      {
        title: 'Bukti Pendukung',
        description: 'Lampirkan bukti jika ada.',
        fields: ['evidence_url'],
      },
      {
        title: 'Permintaan / Tindakan',
        description: 'Sampaikan tindakan yang diharapkan.',
        fields: ['requested_action'],
      },
      {
        title: 'Pernyataan',
        description: 'Konfirmasi pernyataan dan persetujuan.',
        fields: ['declaration_name', 'declaration_date', 'declaration_signature', 'declaration_agreed'],
      },
    ],
    []
  );

  const isLastStep = currentStep === steps.length - 1;

  useEffect(() => {
    try {
      const rawDraft = localStorage.getItem(ADVOCACY_DRAFT_KEY);
      const rawStep = localStorage.getItem(ADVOCACY_STEP_KEY);

      if (rawDraft) {
        const parsed = JSON.parse(rawDraft);
        if (parsed && typeof parsed === 'object') {
          form.reset({ ...form.getValues(), ...parsed });
        }
      }

      if (rawStep !== null) {
        const stepNumber = Number(rawStep);
        if (!Number.isNaN(stepNumber) && stepNumber >= 0 && stepNumber < steps.length) {
          setCurrentStep(stepNumber);
        }
      }
    } catch {
      localStorage.removeItem(ADVOCACY_DRAFT_KEY);
      localStorage.removeItem(ADVOCACY_STEP_KEY);
    }
  }, []);

  useEffect(() => {
    const subscription = form.watch((value) => {
      try {
        localStorage.setItem(ADVOCACY_DRAFT_KEY, JSON.stringify(value));
      } catch {
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    localStorage.setItem(ADVOCACY_STEP_KEY, String(currentStep));
  }, [currentStep]);

  const handleUploadEvidence = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await api.uploads.publicAttachment(file);
      form.setValue('evidence_url', uploaded.url, { shouldValidate: true });
      toast.success('Bukti pendukung berhasil diunggah');
    } catch (error: any) {
      toast.error(error?.message || 'Gagal mengunggah bukti pendukung');
    } finally {
      setIsUploading(false);
    }
  };

  const goNext = async () => {
    const fields = steps[currentStep].fields;
    const isValid = await form.trigger(fields as any);
    if (!isValid) return;
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const goPrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const submitComplaint = async (values: FormValues) => {
    const sanitizedPhone = sanitizeInput(values.phone_whatsapp);
    const sanitizedEmail = sanitizeInput(values.email || '');

    if (!validatePhone(sanitizedPhone.replace(/[\s-]/g, ''))) {
      toast.error('Format Nomor Telepon / WhatsApp tidak valid');
      return;
    }

    if (sanitizedEmail && !validateEmail(sanitizedEmail)) {
      toast.error('Format email tidak valid');
      return;
    }

    const payload: ComplaintSubmission = {
      full_name: sanitizeInput(values.full_name),
      id_number: sanitizeInput(values.id_number),
      birth_date: values.birth_date,
      malaysia_address: sanitizeInput(values.malaysia_address),
      phone_whatsapp: sanitizedPhone,
      email: sanitizedEmail,
      employer_name: sanitizeInput(values.employer_name),
      employer_address: sanitizeInput(values.employer_address),
      job_type: sanitizeInput(values.job_type),
      work_duration: sanitizeInput(values.work_duration),
      complaint_types: values.complaint_types,
      complaint_other: sanitizeInput(values.complaint_other || ''),
      chronology: sanitizeInput(values.chronology),
      evidence_url: sanitizeInput(values.evidence_url || ''),
      requested_action: sanitizeInput(values.requested_action),
      declaration_name: sanitizeInput(values.declaration_name),
      declaration_date: values.declaration_date,
      declaration_signature: sanitizeInput(values.declaration_signature),
      declaration_agreed: values.declaration_agreed,
    };

    setIsSubmitting(true);
    try {
      await api.complaints.create(payload);
      setIsSuccess(true);
      toast.success('Pengaduan berhasil dikirim. Tim relawan akan menindaklanjuti.');
      form.reset();
      setCurrentStep(0);
      localStorage.removeItem(ADVOCACY_DRAFT_KEY);
      localStorage.removeItem(ADVOCACY_STEP_KEY);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal mengirim pengaduan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 pb-24 max-w-6xl space-y-10">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-primary">Advokasi & Pengaduan Layanan PMI</h1>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          Layanan pendampingan sosial dan administratif untuk Pekerja Migran Indonesia di Malaysia.
        </p>
      </div>

      <Card className="shadow-sm border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Alur Bantuan</CardTitle>
          <CardDescription>Proses pendampingan dijalankan bertahap agar penanganan lebih terarah dan terukur.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg border bg-muted/30 p-4"><strong>1.</strong> Pengaduan diterima dan diverifikasi oleh tim relawan.</div>
          <div className="rounded-lg border bg-muted/30 p-4"><strong>2.</strong> Klarifikasi dokumen, bukti, dan kronologi dengan pengadu.</div>
          <div className="rounded-lg border bg-muted/30 p-4"><strong>3.</strong> Pendampingan sosial/administratif dan koordinasi ke otoritas terkait.</div>
          <div className="rounded-lg border bg-muted/30 p-4"><strong>4.</strong> Monitoring tindak lanjut hingga status pengaduan ditutup.</div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>FORMULIR PENGADUAN LAYANAN PMI</CardTitle>
              <CardDescription>{steps[currentStep].description}</CardDescription>
            </CardHeader>
            <CardContent>
              {isSuccess ? (
                <div className="text-center py-10 space-y-4">
                  <CheckCircle2 className="h-14 w-14 text-green-600 mx-auto" />
                  <h3 className="text-xl font-bold">Pengaduan Terkirim</h3>
                  <p className="text-muted-foreground">Terima kasih. Tim relawan akan menghubungi Anda sesuai prioritas kasus.</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsSuccess(false);
                      setCurrentStep(0);
                    }}
                  >
                    Kirim Pengaduan Baru
                  </Button>
                </div>
              ) : (
                <Form {...(form as any)}>
                  <form onSubmit={form.handleSubmit(submitComplaint as any)} className="space-y-6">
                    <div className="text-sm text-muted-foreground">
                      Bagian {currentStep + 1} dari {steps.length}: <span className="font-medium text-foreground">{steps[currentStep].title}</span>
                    </div>

                    {currentStep === 0 && (
                      <section className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={form.control} name="full_name" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nama Lengkap</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />

                          <FormField control={form.control} name="id_number" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nomor KTP / Paspor</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />

                          <FormField control={form.control} name="birth_date" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tanggal Lahir</FormLabel>
                              <FormControl><Input type="date" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />

                          <FormField control={form.control} name="phone_whatsapp" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nomor Telepon / WhatsApp</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />

                          <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email (jika ada)</FormLabel>
                              <FormControl><Input type="email" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />

                          <div className="md:col-span-2">
                            <FormField control={form.control} name="malaysia_address" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Alamat di Malaysia</FormLabel>
                                <FormControl><Textarea className="min-h-[90px]" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                        </div>
                      </section>
                    )}

                    {currentStep === 1 && (
                      <section className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={form.control} name="employer_name" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nama Perusahaan / Majikan</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />

                          <FormField control={form.control} name="job_type" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Jenis Pekerjaan</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />

                          <FormField control={form.control} name="work_duration" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lama Bekerja</FormLabel>
                              <FormControl><Input placeholder="Contoh: 2 tahun 4 bulan" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />

                          <div className="md:col-span-2">
                            <FormField control={form.control} name="employer_address" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Alamat / Lokasi Kerja</FormLabel>
                                <FormControl><Textarea className="min-h-[90px]" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                        </div>
                      </section>
                    )}

                    {currentStep === 2 && (
                      <section className="space-y-4">
                        <FormField
                          control={form.control}
                          name="complaint_types"
                          render={() => (
                            <FormItem className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {complaintTypeOptions.map((item) => (
                                  <FormField
                                    key={item}
                                    control={form.control}
                                    name="complaint_types"
                                    render={({ field }) => {
                                      const checked = field.value.includes(item);
                                      return (
                                        <FormItem className="flex items-center gap-2 space-y-0 rounded-md border p-2">
                                          <FormControl>
                                            <Checkbox
                                              checked={checked}
                                              onCheckedChange={(isChecked) => {
                                                const next = isChecked
                                                  ? [...field.value, item]
                                                  : field.value.filter((value: string) => value !== item);
                                                field.onChange(next);
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="font-normal text-sm">{item}</FormLabel>
                                        </FormItem>
                                      );
                                    }}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField control={form.control} name="complaint_other" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lainnya</FormLabel>
                            <FormControl><Input placeholder="Isi jika ada jenis pengaduan lain" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </section>
                    )}

                    {currentStep === 3 && (
                      <section className="space-y-4">
                        <FormField control={form.control} name="chronology" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tuliskan secara jelas kejadian yang dialami, termasuk tanggal, tempat, dan pihak terkait.</FormLabel>
                            <FormControl><Textarea className="min-h-[180px]" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </section>
                    )}

                    {currentStep === 4 && (
                      <section className="space-y-4">
                        <p className="text-sm text-muted-foreground">Foto, dokumen, kontrak, rekaman, dan lainnya.</p>
                        <FormField control={form.control} name="evidence_url" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Terlampir / Upload</FormLabel>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <FormControl>
                                <Input placeholder="URL bukti atau hasil upload" {...field} />
                              </FormControl>
                              <Input
                                id="complaint-evidence-upload"
                                type="file"
                                className="hidden"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    handleUploadEvidence(file);
                                  }
                                  event.target.value = '';
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                disabled={isUploading}
                                onClick={() => document.getElementById('complaint-evidence-upload')?.click()}
                              >
                                <FileUp className="h-4 w-4 mr-2" />
                                {isUploading ? 'Uploading...' : 'Upload'}
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </section>
                    )}

                    {currentStep === 5 && (
                      <section className="space-y-4">
                        <FormField control={form.control} name="requested_action" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tindakan yang diinginkan / Permintaan</FormLabel>
                            <FormControl><Textarea className="min-h-[140px]" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </section>
                    )}

                    {currentStep === 6 && (
                      <section className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Saya menyatakan bahwa informasi yang saya berikan adalah benar dan dapat dipertanggungjawabkan.
                          Saya bersedia mengikuti prosedur tindak lanjut dari pengaduan ini.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={form.control} name="declaration_name" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nama Pengadu</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />

                          <FormField control={form.control} name="declaration_date" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tanggal</FormLabel>
                              <FormControl><Input type="date" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />

                          <div className="md:col-span-2">
                            <FormField control={form.control} name="declaration_signature" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tanda Tangan (ketik nama lengkap)</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name="declaration_agreed"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-start gap-2 rounded-md border p-3">
                                <FormControl>
                                  <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                                </FormControl>
                                <FormLabel className="font-normal leading-relaxed">
                                  Saya menyetujui pernyataan di atas dan memahami bahwa data akan diproses sesuai prosedur internal.
                                </FormLabel>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </section>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <Button type="button" variant="outline" onClick={goPrev} disabled={currentStep === 0 || isSubmitting}>
                        Sebelumnya
                      </Button>

                      {isLastStep ? (
                        <Button type="submit" className="min-w-40" disabled={isSubmitting || isUploading}>
                          {isSubmitting ? 'Mengirim Pengaduan...' : 'Kirim Pengaduan'}
                        </Button>
                      ) : (
                        <Button type="button" className="min-w-32" onClick={goNext} disabled={isSubmitting || isUploading}>
                          Lanjut
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5 text-primary" /> Kontak Relawan</CardTitle>
              <CardDescription>Kontak Team Pendamping dan Advokasi PMI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ADVOCACY_VOLUNTEER_CONTACTS.map((contact) => (
                <div key={contact.waLink} className="bg-muted rounded-2xl shadow-sm p-6 text-center space-y-3 border">
                  <h3 className="text-lg font-semibold text-foreground">{contact.label}</h3>
                  <p className="text-sm text-muted-foreground">{contact.phoneDisplay}</p>
                  <a href={`${contact.waLink}?text=${encodeURIComponent(contact.waMessage)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M20.52 3.48A11.83 11.83 0 0012.05 0C5.52 0 .19 5.33.19 11.86c0 2.09.55 4.12 1.6 5.92L0 24l6.42-1.68a11.86 11.86 0 005.63 1.43h.01c6.53 0 11.86-5.33 11.86-11.86 0-3.17-1.23-6.15-3.4-8.41zM12.06 21.5c-1.83 0-3.62-.49-5.19-1.42l-.37-.22-3.81 1 1.02-3.71-.24-.38a9.53 9.53 0 01-1.48-5.07c0-5.28 4.3-9.58 9.59-9.58 2.56 0 4.96 1 6.77 2.81a9.52 9.52 0 012.8 6.77c0 5.28-4.3 9.58-9.59 9.58z" />
                    </svg>
                    WhatsApp
                  </a>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-900 flex items-center gap-2"><AlertCircle className="h-5 w-5" /> Disclaimer Hukum Resmi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-amber-900 leading-relaxed">
          <p>1. Informasi, panduan, dan layanan yang diberikan melalui formulir ini atau oleh relawan pendamping PMI diberikan hanya untuk tujuan sosial dan administratif. Informasi tersebut tidak menggantikan nasihat hukum profesional dan tidak dapat dijadikan dasar keputusan hukum secara resmi.</p>
          <p>2. Organisasi, relawan, dan pihak penyelenggara tidak bertanggung jawab atas segala kerugian, kerusakan, atau konsekuensi hukum yang timbul akibat penggunaan informasi atau tindakan yang dilakukan berdasarkan informasi tersebut.</p>
          <p>3. Pengguna atau pengadu bertanggung jawab penuh atas keakuratan, kejujuran, dan kelengkapan informasi yang diberikan dalam formulir pengaduan ini. Segala tindakan penyalahgunaan informasi atau dokumen menjadi tanggung jawab sepenuhnya dari pihak pengadu.</p>
          <p>4. Pengaduan yang diterima akan ditindaklanjuti sesuai prosedur internal organisasi dan peraturan hukum yang berlaku di Malaysia, serta melalui koordinasi dengan Kedutaan Besar Republik Indonesia / Konsulat Jenderal RI. Namun, penyelesaian sengketa atau persoalan hukum tetap berada di ranah otoritas resmi Malaysia.</p>
          <p>5. Dengan menggunakan formulir atau layanan ini, pengguna dianggap telah membaca, memahami, dan menyetujui semua ketentuan dalam disclaimer hukum ini.</p>
        </CardContent>
      </Card>
    </div>
  );
}
