import { useEffect, useState } from 'react';
import { api } from '@/db/api';
import type { Complaint } from '@/db/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { MessageSquare, Phone, Mail, Clock, ShieldAlert, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ComplaintManagement() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const data = await api.complaints.list();
      setComplaints(data);
    } catch (err) {
      toast.error('Gagal memuat daftar pengaduan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleStatusChange = async (id: string, status: Complaint['status']) => {
    try {
      await api.complaints.updateStatus(id, status);
      toast.success('Status pengaduan diperbarui');
      fetchComplaints();
    } catch (err) {
      toast.error('Gagal memperbarui status');
    }
  };

  const getStatusBadge = (status: Complaint['status']) => {
    switch (status) {
      case 'pending': return <Badge variant="destructive" className="flex items-center gap-1 uppercase text-[10px]"><Clock className="h-3 w-3" /> Baru</Badge>;
      case 'in_progress': return <Badge variant="secondary" className="flex items-center gap-1 uppercase text-[10px] bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200"><ShieldAlert className="h-3 w-3" /> Diproses</Badge>;
      case 'resolved': return <Badge variant="default" className="flex items-center gap-1 uppercase text-[10px] bg-green-100 text-green-800 hover:bg-green-100 border-green-200"><CheckCircle2 className="h-3 w-3" /> Selesai</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-primary">Manajemen Pengaduan PMI</h2>
          <p className="text-muted-foreground text-sm">Kelola dan pantau status pengaduan yang masuk dari Pekerja Migran.</p>
        </div>
      </div>

      <div className="rounded-xl border bg-background shadow-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50 border-b">
            <TableRow>
              <TableHead className="w-[150px]">Pelapor</TableHead>
              <TableHead>Masalah</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[150px]">Waktu Masuk</TableHead>
              <TableHead className="text-right w-[150px]">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 animate-pulse text-muted-foreground italic font-medium">Memuat data pengaduan...</TableCell>
              </TableRow>
            ) : complaints.length > 0 ? (
              complaints.map((comp) => (
                <TableRow key={comp.id} className="hover:bg-muted/30 transition-colors border-b last:border-0 group">
                  <TableCell className="align-top py-6">
                    <div className="space-y-2">
                      <div className="font-bold text-sm text-primary group-hover:underline transition-all">{comp.name}</div>
                      <div className="flex flex-col gap-1 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {comp.contact}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="align-top py-6">
                    <div className="bg-muted/30 p-4 rounded-lg border border-primary/5 shadow-inner">
                      <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{comp.issue}</p>
                    </div>
                  </TableCell>
                  <TableCell className="align-top py-6">
                    <div className="pt-1">{getStatusBadge(comp.status)}</div>
                  </TableCell>
                  <TableCell className="align-top py-6">
                    <div className="text-xs text-muted-foreground font-medium pt-1 italic">{formatDate(comp.created_at, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </TableCell>
                  <TableCell className="text-right align-top py-6">
                    <div className="flex justify-end gap-2">
                      <Select onValueChange={(val) => handleStatusChange(comp.id, val as any)} defaultValue={comp.status}>
                        <SelectTrigger className="w-[130px] h-9 text-xs">
                          <SelectValue placeholder="Ubah Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Baru (Pending)</SelectItem>
                          <SelectItem value="in_progress">Diproses</SelectItem>
                          <SelectItem value="resolved">Selesai (Closed)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic border-2 border-dashed mx-4 my-8 rounded-xl block">Belum ada pengaduan yang masuk melalui sistem.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Admin Advisory */}
      <Card className="bg-amber-50 border-amber-100 shadow-sm border-2">
        <CardHeader className="flex flex-row items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-amber-600" />
          <div>
            <CardTitle className="text-amber-900 text-lg">Peringatan Keamanan Data</CardTitle>
            <CardDescription className="text-amber-800/80">Mohon berhati-hati dalam menangani data pelapor.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-800 leading-relaxed italic border-l-4 border-amber-600 pl-4 py-2 bg-amber-100/50 rounded-r-lg">
            "Seluruh informasi dalam tabel di atas bersifat sangat rahasia. Dilarang menyebarkan kontak atau detil masalah pelapor ke pihak ketiga tanpa persetujuan tim hukum dan pelapor itu sendiri demi menjaga keselamatan jiwa mereka di lapangan."
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
