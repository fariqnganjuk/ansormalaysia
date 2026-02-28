import { useEffect, useState } from 'react';
import { api } from '@/db';
import type { Post } from '@/db';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { formatDate, slugify } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeInput, sanitizeHtml, sanitizeUrl, validateFile } from '@/lib/security';

const postSchema = z.object({
  title: z.string()
    .min(5, 'Judul minimal 5 karakter')
    .max(200, 'Judul maksimal 200 karakter'),
  content: z.string()
    .min(20, 'Konten minimal 20 karakter')
    .max(50000, 'Konten terlalu panjang'),
  excerpt: z.string()
    .max(500, 'Ringkasan maksimal 500 karakter')
    .optional()
    .default(''),
  type: z.enum(['pmi_news', 'activity', 'inspiration', 'opinion']),
  category: z.string()
    .min(2, 'Kategori minimal 2 karakter')
    .max(50, 'Kategori maksimal 50 karakter'),
  image_url: z.string().optional().default(''),
  is_published: z.boolean().default(false),
});

type PostFormValues = z.infer<typeof postSchema>;

const POST_TYPE_LABELS: Record<Post['type'], string> = {
  pmi_news: 'Berita PMI',
  activity: 'Kegiatan',
  inspiration: 'Tokoh & Inspirasi',
  opinion: 'Opini',
};

type PostManagementProps = {
  fixedType?: Post['type'];
  title?: string;
};

export default function PostManagement({ fixedType, title }: PostManagementProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const activeType = fixedType ?? 'pmi_news';
  const pageTitle = title || (fixedType ? `Kelola ${POST_TYPE_LABELS[fixedType]}` : 'Kelola Semua Konten');

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema) as any,
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      type: activeType,
      category: '',
      image_url: '',
      is_published: false,
    },
  });

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await api.posts.list({
        type: fixedType,
        limit: 100,
        publishedOnly: false,
      });
      setPosts(data);
    } catch (err) {
      toast.error('Gagal memuat daftar konten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    form.setValue('type', activeType);
    fetchPosts();
  }, [fixedType]);

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    form.reset({
      title: post.title,
      content: post.content || '',
      excerpt: post.excerpt || '',
      type: post.type,
      category: post.category || '',
      image_url: post.image_url || '',
      is_published: post.is_published,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus konten ini?')) return;
    try {
      await api.posts.delete(id);
      toast.success('Konten berhasil dihapus');
      fetchPosts();
    } catch (err) {
      toast.error('Gagal menghapus konten');
    }
  };

  const onSubmit = async (values: PostFormValues) => {
    setSubmitting(true);
    try {
      // Sanitize all inputs
      const sanitizedTitle = sanitizeInput(values.title);
      const sanitizedContent = sanitizeHtml(values.content);
      const sanitizedExcerpt = sanitizeInput(values.excerpt || '');
      const sanitizedCategory = sanitizeInput(values.category);
      const sanitizedImageUrl = sanitizeUrl(values.image_url || '');

      const slug = slugify(sanitizedTitle);
      const postData: Partial<Post> = {
        title: sanitizedTitle,
        content: sanitizedContent,
        excerpt: sanitizedExcerpt,
        type: fixedType ?? values.type,
        category: sanitizedCategory,
        image_url: sanitizedImageUrl,
        is_published: values.is_published,
        slug,
        author_id: user?.id,
        published_at: values.is_published ? new Date().toISOString() : null,
      };

      if (editingPost) {
        await api.posts.update(editingPost.id, postData);
        toast.success('Konten berhasil diperbarui');
      } else {
        await api.posts.create(postData);
        toast.success('Konten berhasil dibuat');
      }
      setIsDialogOpen(false);
      setEditingPost(null);
      form.reset({
        title: '',
        content: '',
        excerpt: '',
        type: activeType,
        category: '',
        image_url: '',
        is_published: false,
      });
      fetchPosts();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal menyimpan konten');
    } finally {
      setSubmitting(false);
    }
  };

  // Image Upload Handler with validation
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file, {
      maxSize: 1024 * 1024, // 1MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary">{pageTitle}</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingPost(null);
            form.reset({
              title: '',
              content: '',
              excerpt: '',
              type: activeType,
              category: '',
              image_url: '',
              is_published: false,
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Tambah Konten Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPost ? 'Edit Konten' : 'Tambah Konten Baru'}</DialogTitle>
              <DialogDescription>Isi detail konten di bawah ini. Judul akan otomatis diubah menjadi slug URL.</DialogDescription>
            </DialogHeader>
            <Form {...(form as any)}>
              <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control as any}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Judul Konten</FormLabel>
                        <FormControl>
                          <Input placeholder="Judul berita/opini..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    {fixedType ? (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tipe</label>
                        <div className="h-10 rounded-md border bg-muted px-3 flex items-center text-sm">
                          {POST_TYPE_LABELS[fixedType]}
                        </div>
                      </div>
                    ) : (
                      <FormField
                        control={form.control as any}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipe</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih Tipe" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pmi_news">Berita PMI</SelectItem>
                                <SelectItem value="activity">Kegiatan</SelectItem>
                                <SelectItem value="inspiration">Inspirasi</SelectItem>
                                <SelectItem value="opinion">Opini</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control as any}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kategori</FormLabel>
                          <FormControl>
                            <Input placeholder="Kebijakan/Hukum..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control as any}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ringkasan (Excerpt)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Ringkasan singkat untuk tampilan kartu..." className="h-20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konten Lengkap</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tulis isi konten secara mendalam..." className="min-h-[300px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <FormField
                    control={form.control as any}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Gambar (atau Unggah)</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <div className="relative">
                            <Input
                              type="file"
                              className="hidden"
                              id="image-upload"
                              accept="image/*"
                              onChange={handleImageUpload}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById('image-upload')?.click()}
                              disabled={submitting}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="is_published"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/30">
                        <div className="space-y-0.5">
                          <FormLabel>Publikasikan Langsung</FormLabel>
                          <div className="text-[10px] text-muted-foreground">Aktifkan agar konten muncul di website publik.</div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={submitting} className="w-full md:w-auto h-12 px-12">
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingPost ? 'Perbarui Konten' : 'Simpan Konten'}
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
              <TableHead className="w-[300px]">Judul</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 animate-pulse">Memuat data...</TableCell>
              </TableRow>
            ) : posts.length > 0 ? (
              posts.map((post) => (
                <TableRow key={post.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {post.image_url ? (
                        <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                          <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="line-clamp-1">{post.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase">{post.type.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell>{post.category}</TableCell>
                  <TableCell>
                    {post.is_published ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Terbit</Badge>
                    ) : (
                      <Badge variant="secondary">Draf</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(post.created_at)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(post)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">Belum ada konten.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
