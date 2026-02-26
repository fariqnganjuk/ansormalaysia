import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock, User as UserIcon, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithUsername } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signInWithUsername(username, password);
    if (error) {
      toast.error('Gagal masuk. Silakan periksa username dan password Anda.');
      setLoading(false);
    } else {
      toast.success('Berhasil masuk!');
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <Button asChild variant="ghost" className="mb-8 hover:text-primary">
        <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Beranda</Link>
      </Button>

      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto shadow-lg">
            NU
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold text-primary">Masuk Admin</CardTitle>
            <CardDescription>Gunakan akun administrator untuk mengelola konten.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Username Anda"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full font-bold h-11" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Masuk Sekarang'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center">
          <p className="text-xs text-muted-foreground italic">
            Hanya administrator terdaftar yang dapat mengakses dashboard.
          </p>
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-[10px] text-amber-800 leading-tight">
            <strong>Catatan untuk Pengembang:</strong> Jika Anda adalah pengguna pertama, silakan hubungi pengelola sistem untuk pengaturan peran administrator awal.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
