import { useEffect, useState } from 'react';
import { api } from '@/db';
import type { UserAccount, UserRole } from '@/db';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Edit, Loader2, Plus, Trash2, UserCog } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeInput, sanitizeUrl } from '@/lib/security';

const schema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').max(100, 'Username terlalu panjang'),
  email: z.string().email('Email tidak valid').max(190, 'Email terlalu panjang'),
  full_name: z.string().max(190, 'Nama terlalu panjang').optional().default(''),
  avatar_url: z.string().optional().default(''),
  role: z.enum(['admin', 'user']),
  password: z.string().optional().default(''),
});

type FormValues = z.infer<typeof schema>;

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserAccount | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      username: '',
      email: '',
      full_name: '',
      avatar_url: '',
      role: 'user',
      password: '',
    },
  });

  const resetForm = () => {
    setEditing(null);
    form.reset({
      username: '',
      email: '',
      full_name: '',
      avatar_url: '',
      role: 'user',
      password: '',
    });
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.users.list();
      setUsers(data);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onEdit = (target: UserAccount) => {
    setEditing(target);
    form.reset({
      username: target.username,
      email: target.email || '',
      full_name: target.full_name || '',
      avatar_url: target.avatar_url || '',
      role: target.role,
      password: '',
    });
    setOpen(true);
  };

  const onDelete = async (id: string) => {
    if (!confirm('Hapus user ini?')) return;
    try {
      await api.users.delete(id);
      toast.success('User berhasil dihapus');
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menghapus user');
    }
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        username: sanitizeInput(values.username),
        email: sanitizeInput(values.email),
        full_name: sanitizeInput(values.full_name || ''),
        avatar_url: sanitizeUrl(values.avatar_url || ''),
        role: values.role as UserRole,
      };

      if (editing) {
        await api.users.update(editing.id, {
          ...payload,
          password: values.password ? values.password : undefined,
        });
        toast.success('User berhasil diperbarui');
      } else {
        if (!values.password || values.password.length < 6) {
          toast.error('Password minimal 6 karakter untuk user baru');
          return;
        }

        await api.users.create({
          ...payload,
          password: values.password,
        });
        toast.success('User berhasil ditambahkan');
      }

      setOpen(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Kelola Pengguna</h2>
          <p className="text-sm text-muted-foreground">Kelola akun admin dan user dashboard.</p>
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
              <Plus className="mr-2 h-4 w-4" /> Tambah Pengguna
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Pengguna' : 'Tambah Pengguna'}</DialogTitle>
              <DialogDescription>
                {editing ? 'Anda bisa ubah profil, role, dan reset password jika dibutuhkan.' : 'Isi data akun baru untuk akses dashboard.'}
              </DialogDescription>
            </DialogHeader>

            <Form {...(form as any)}>
              <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
                <FormField
                  control={form.control as any}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@domain.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama lengkap" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="avatar_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{editing ? 'Password Baru (opsional)' : 'Password'}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder={editing ? 'Isi jika ingin reset password' : 'Minimal 6 karakter'} {...field} />
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
              <TableHead>Pengguna</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal Buat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 animate-pulse">Memuat data...</TableCell>
              </TableRow>
            ) : users.length ? (
              users.map((item) => {
                const isSelf = user?.id === item.id;
                return (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="font-medium">{item.full_name || item.username}</div>
                      <div className="text-xs text-muted-foreground">@{item.username}</div>
                      <div className="text-xs text-muted-foreground">{item.email || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.role === 'admin' ? 'default' : 'secondary'}>{item.role.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>
                      {isSelf ? <Badge variant="outline">Akun Anda</Badge> : <Badge variant="outline">Aktif</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(item.created_at)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => onDelete(item.id)}
                        disabled={isSelf}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">Belum ada pengguna.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground flex items-start gap-2">
        <UserCog className="h-4 w-4 mt-0.5" />
        <p>
          Catatan: akun yang sedang digunakan tidak bisa dihapus. Untuk keamanan, role akun sendiri juga tidak bisa diturunkan dari admin ke user.
        </p>
      </div>
    </div>
  );
}
