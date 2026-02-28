import { useEffect, useState } from 'react';
import { api } from '@/db';
import type { Infographic } from '@/db';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Edit, Image as ImageIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { sanitizeInput, sanitizeUrl, validateFile } from '@/lib/security';

const schema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter').max(255, 'Judul terlalu panjang'),
  image_url: z.string().min(1, 'Gambar wajib diisi'),
  description: z.string().max(5000, 'Deskripsi terlalu panjang').optional().default(''),
  location_name: z.string().max(190, 'Lokasi terlalu panjang').optional().default(''),
  latitude: z.string().optional().default(''),
  longitude: z.string().optional().default(''),
  data_value: z.string().optional().default(''),
  data_type: z.string().max(120, 'Tipe data terlalu panjang').optional().default(''),
});

type FormValues = z.infer<typeof schema>;

const toNullableNumber = (value: string) => {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function InfographicManagement() {
  const [items, setItems] = useState<Infographic[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Infographic | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      title: '',
      image_url: '',
      description: '',
      location_name: '',
      latitude: '',
      longitude: '',
      data_value: '',
      data_type: '',
    },
  });

  const resetForm = () => {
    setEditing(null);
    form.reset({
      title: '',
      image_url: '',
      description: '',
      location_name: '',
      latitude: '',
      longitude: '',
      data_value: '',
      data_type: '',
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.infographics.list();
      setItems(data);
    } catch {
      toast.error('Gagal memuat data infografis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onEdit = (item: Infographic) => {
    setEditing(item);
    form.reset({
      title: item.title,
      image_url: item.image_url,
      description: item.description || '',
      location_name: item.location_name || '',
      latitude: item.latitude !== null ? String(item.latitude) : '',
      longitude: item.longitude !== null ? String(item.longitude) : '',
      data_value: item.data_value !== null ? String(item.data_value) : '',
      data_type: item.data_type || '',
    });
    setOpen(true);
  };

  const onDelete = async (id: string) => {
    if (!confirm('Hapus data infografis ini?')) return;
    try {
      await api.infographics.delete(id);
      toast.success('Infografis berhasil dihapus');
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menghapus infografis');
    }
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        title: sanitizeInput(values.title),
        image_url: sanitizeUrl(values.image_url),
        description: sanitizeInput(values.description || ''),
        location_name: sanitizeInput(values.location_name || ''),
        latitude: toNullableNumber(values.latitude),
        longitude: toNullableNumber(values.longitude),
        data_value: toNullableNumber(values.data_value),
        data_type: sanitizeInput(values.data_type || ''),
      };

      if (editing) {
        await api.infographics.update(editing.id, payload as Partial<Infographic>);
        toast.success('Infografis berhasil diperbarui');
      } else {
        await api.infographics.create(payload as Omit<Infographic, 'id' | 'created_at'>);
        toast.success('Infografis berhasil ditambahkan');
      }

      setOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan infografis');
    } finally {
      setSubmitting(false);
    }
  };

  const onUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, {
      maxSize: 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    });

    if (!validation.valid) {
      toast.error(validation.error);
      e.target.value = '';
      return;
    }

    setSubmitting(true);
    try {
      const uploaded = await api.uploads.image(file);
      form.setValue('image_url', uploaded.url);
      toast.success('Gambar berhasil diunggah');
    } catch (err: any) {
      toast.error(err?.message || 'Gagal mengunggah gambar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Kelola Infografis</h2>
          <p className="text-sm text-muted-foreground">Kelola data infografis untuk halaman Data & Infografis.</p>
        </div>

        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Tambah Infografis
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Infografis' : 'Tambah Infografis'}</DialogTitle>
              <DialogDescription>Lengkapi data infografis di bawah ini.</DialogDescription>
            </DialogHeader>

            <Form {...(form as any)}>
              <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit as any)}>
                <FormField
                  control={form.control as any}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Judul</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Sebaran PMI 2026" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Gambar</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <Input id="info-image-upload" type="file" className="hidden" accept="image/*" onChange={onUploadImage} />
                        <Button type="button" variant="outline" onClick={() => document.getElementById('info-image-upload')?.click()} disabled={submitting}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Deskripsi singkat infografis..." className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="location_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lokasi</FormLabel>
                        <FormControl>
                          <Input placeholder="Kuala Lumpur" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="data_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipe Data</FormLabel>
                        <FormControl>
                          <Input placeholder="jumlah_pmi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control as any}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input placeholder="3.1390" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input placeholder="101.6869" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="data_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nilai Data</FormLabel>
                        <FormControl>
                          <Input placeholder="1200" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {editing ? 'Perbarui' : 'Simpan'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border bg-background shadow-md overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Judul</TableHead>
              <TableHead>Gambar</TableHead>
              <TableHead>Lokasi</TableHead>
              <TableHead>Nilai</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 animate-pulse">Memuat data...</TableCell>
              </TableRow>
            ) : items.length ? (
              items.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{item.description || '-'}</div>
                  </TableCell>
                  <TableCell>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="h-10 w-10 rounded object-cover border" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{item.location_name || '-'}</TableCell>
                  <TableCell>{item.data_value ?? '-'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(item.created_at)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => onDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">Belum ada data infografis.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
