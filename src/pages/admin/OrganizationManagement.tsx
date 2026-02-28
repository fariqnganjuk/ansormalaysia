import { useEffect, useState } from 'react';
import { api } from '@/db';
import type { Organization } from '@/db';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Edit, Image as ImageIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { sanitizeInput, sanitizeUrl, validateFile } from '@/lib/security';

const schema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(190, 'Nama terlalu panjang'),
  description: z.string().max(5000, 'Deskripsi terlalu panjang').optional().default(''),
  logo_url: z.string().optional().default(''),
  type: z.enum(['PCINU', 'Banom']),
});

type FormValues = z.infer<typeof schema>;

export default function OrganizationManagement() {
  const [items, setItems] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: '',
      description: '',
      logo_url: '',
      type: 'Banom',
    },
  });

  const resetForm = () => {
    setEditing(null);
    form.reset({
      name: '',
      description: '',
      logo_url: '',
      type: 'Banom',
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.organizations.list();
      setItems(data);
    } catch {
      toast.error('Gagal memuat data organisasi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onEdit = (item: Organization) => {
    setEditing(item);
    form.reset({
      name: item.name,
      description: item.description || '',
      logo_url: item.logo_url || '',
      type: item.type,
    });
    setOpen(true);
  };

  const onDelete = async (id: string) => {
    if (!confirm('Hapus data organisasi ini?')) return;
    try {
      await api.organizations.delete(id);
      toast.success('Organisasi berhasil dihapus');
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menghapus organisasi');
    }
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        name: sanitizeInput(values.name),
        description: sanitizeInput(values.description || ''),
        logo_url: sanitizeUrl(values.logo_url || ''),
        type: values.type,
      };

      if (editing) {
        await api.organizations.update(editing.id, payload);
        toast.success('Organisasi berhasil diperbarui');
      } else {
        await api.organizations.create(payload);
        toast.success('Organisasi berhasil ditambahkan');
      }

      setOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan organisasi');
    } finally {
      setSubmitting(false);
    }
  };

  const onUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      form.setValue('logo_url', uploaded.url);
      toast.success('Logo berhasil diunggah');
    } catch (err: any) {
      toast.error(err?.message || 'Gagal mengunggah logo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Kelola Organisasi</h2>
          <p className="text-sm text-muted-foreground">Manajemen data PCINU dan Banom yang tampil di website.</p>
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
              <Plus className="mr-2 h-4 w-4" /> Tambah Organisasi
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Organisasi' : 'Tambah Organisasi'}</DialogTitle>
              <DialogDescription>Lengkapi data organisasi di bawah ini.</DialogDescription>
            </DialogHeader>

            <Form {...(form as any)}>
              <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit as any)}>
                <FormField
                  control={form.control as any}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Organisasi</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: GP Ansor Malaysia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tipe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PCINU">PCINU</SelectItem>
                          <SelectItem value="Banom">Banom</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <Textarea placeholder="Deskripsi organisasi..." className="min-h-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="logo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <Input id="org-logo-upload" type="file" className="hidden" accept="image/*" onChange={onUploadLogo} />
                        <Button type="button" variant="outline" onClick={() => document.getElementById('org-logo-upload')?.click()} disabled={submitting}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
              <TableHead>Nama</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Logo</TableHead>
              <TableHead>Terakhir Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 animate-pulse">Memuat data...</TableCell>
              </TableRow>
            ) : items.length ? (
              items.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{item.description || '-'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {item.logo_url ? (
                      <img src={item.logo_url} alt={item.name} className="h-10 w-10 rounded object-cover border" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
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
                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">Belum ada data organisasi.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
