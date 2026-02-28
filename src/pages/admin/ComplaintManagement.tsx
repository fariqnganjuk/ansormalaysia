import { useEffect, useState } from 'react';
import { api } from '@/db';
import type { Complaint } from '@/db';
import { jsPDF } from 'jspdf';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { MessageSquare, Phone, Mail, Clock, ShieldAlert, CheckCircle2, Eye } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ComplaintManagement() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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

  const openDetail = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setDetailOpen(true);
  };

  const renderValue = (value?: string | null) => {
    if (!value || value.trim() === '') {
      return '-';
    }

    return value;
  };

  const exportComplaintPdf = (complaint: Complaint) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageHeight = 297;
    const marginX = 14;
    const contentWidth = 182;
    let y = 16;

    const ensureSpace = (required = 8) => {
      if (y + required > pageHeight - 14) {
        doc.addPage();
        y = 16;
      }
    };

    const writeTitle = (text: string) => {
      ensureSpace(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(text, marginX, y);
      y += 8;
    };

    const writeSection = (text: string) => {
      ensureSpace(8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(text, marginX, y);
      y += 6;
    };

    const writeField = (label: string, value?: string | null) => {
      const content = `${label}: ${renderValue(value)}`;
      const lines = doc.splitTextToSize(content, contentWidth);
      ensureSpace(lines.length * 5 + 2);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(lines, marginX, y);
      y += lines.length * 5;
    };

    const writeBlock = (label: string, value?: string | null) => {
      writeField(label, value);
      y += 1;
    };

    writeTitle('FORMULIR PENGADUAN LAYANAN PMI');
    writeField('ID Pengaduan', complaint.id);
    writeField('Tanggal Dibuat', formatDate(complaint.created_at, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
    writeField('Status', complaint.status);
    y += 2;

    writeSection('A. Data Pengadu');
    writeField('Nama Lengkap', complaint.name);
    writeField('Nomor KTP / Paspor', complaint.id_number);
    writeField('Tanggal Lahir', complaint.birth_date);
    writeField('Alamat di Malaysia', complaint.malaysia_address);
    writeField('Nomor Telepon / WhatsApp', complaint.phone_whatsapp || complaint.contact);
    writeField('Email', complaint.email);
    y += 2;

    writeSection('B. Data Tempat Kerja / Majikan');
    writeField('Nama Perusahaan / Majikan', complaint.employer_name);
    writeField('Alamat / Lokasi Kerja', complaint.employer_address);
    writeField('Jenis Pekerjaan', complaint.job_type);
    writeField('Lama Bekerja', complaint.work_duration);
    y += 2;

    writeSection('C. Jenis Pengaduan');
    const complaintTypes = complaint.complaint_types && complaint.complaint_types.length > 0
      ? complaint.complaint_types.join(', ')
      : '-';
    writeField('Jenis', complaintTypes);
    writeField('Lainnya', complaint.complaint_other);
    y += 2;

    writeSection('D. Kronologi Pengaduan');
    writeBlock('Kronologi', complaint.chronology || complaint.issue);

    writeSection('E. Bukti Pendukung');
    writeField('Bukti', complaint.evidence_url);
    y += 2;

    writeSection('F. Tindakan yang Diinginkan / Permintaan');
    writeBlock('Permintaan', complaint.requested_action);

    writeSection('G. Pernyataan');
    writeField('Nama Pengadu', complaint.declaration_name);
    writeField('Tanggal', complaint.declaration_date);
    writeField('Tanda Tangan', complaint.declaration_signature);
    writeField('Persetujuan', complaint.declaration_agreed ? 'Setuju' : 'Tidak');

    const safeName = (complaint.name || 'pengaduan')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50);

    doc.save(`pengaduan-${complaint.id}-${safeName}.pdf`);
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
                      <Button variant="outline" size="sm" onClick={() => openDetail(comp)}>
                        <Eye className="h-4 w-4 mr-1" /> Detail
                      </Button>
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

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pengaduan Layanan PMI</DialogTitle>
          </DialogHeader>

          {selectedComplaint ? (
            <div className="space-y-6 text-sm">
              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={() => exportComplaintPdf(selectedComplaint)}>
                  Export PDF
                </Button>
              </div>

              <section className="space-y-3">
                <h3 className="font-semibold text-primary">A. Data Pengadu</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><span className="font-medium">Nama Lengkap:</span> {renderValue(selectedComplaint.name)}</div>
                  <div><span className="font-medium">Nomor KTP / Paspor:</span> {renderValue(selectedComplaint.id_number)}</div>
                  <div><span className="font-medium">Tanggal Lahir:</span> {renderValue(selectedComplaint.birth_date)}</div>
                  <div><span className="font-medium">Nomor Telepon / WhatsApp:</span> {renderValue(selectedComplaint.phone_whatsapp || selectedComplaint.contact)}</div>
                  <div><span className="font-medium">Email:</span> {renderValue(selectedComplaint.email)}</div>
                  <div><span className="font-medium">Status:</span> {getStatusBadge(selectedComplaint.status)}</div>
                </div>
                <div>
                  <span className="font-medium">Alamat di Malaysia:</span>
                  <p className="mt-1 whitespace-pre-wrap rounded-md border bg-muted/30 p-3">{renderValue(selectedComplaint.malaysia_address)}</p>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-semibold text-primary">B. Data Tempat Kerja / Majikan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><span className="font-medium">Nama Perusahaan / Majikan:</span> {renderValue(selectedComplaint.employer_name)}</div>
                  <div><span className="font-medium">Jenis Pekerjaan:</span> {renderValue(selectedComplaint.job_type)}</div>
                  <div><span className="font-medium">Lama Bekerja:</span> {renderValue(selectedComplaint.work_duration)}</div>
                </div>
                <div>
                  <span className="font-medium">Alamat / Lokasi Kerja:</span>
                  <p className="mt-1 whitespace-pre-wrap rounded-md border bg-muted/30 p-3">{renderValue(selectedComplaint.employer_address)}</p>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-semibold text-primary">C. Jenis Pengaduan</h3>
                {selectedComplaint.complaint_types && selectedComplaint.complaint_types.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedComplaint.complaint_types.map((item) => (
                      <Badge key={item} variant="outline">{item}</Badge>
                    ))}
                  </div>
                ) : (
                  <p>-</p>
                )}
                <div><span className="font-medium">Lainnya:</span> {renderValue(selectedComplaint.complaint_other)}</div>
              </section>

              <section className="space-y-3">
                <h3 className="font-semibold text-primary">D. Kronologi Pengaduan</h3>
                <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3">{renderValue(selectedComplaint.chronology || selectedComplaint.issue)}</p>
              </section>

              <section className="space-y-3">
                <h3 className="font-semibold text-primary">E. Bukti Pendukung</h3>
                {selectedComplaint.evidence_url ? (
                  <a href={selectedComplaint.evidence_url} target="_blank" rel="noreferrer" className="text-primary underline break-all">
                    {selectedComplaint.evidence_url}
                  </a>
                ) : (
                  <p>-</p>
                )}
              </section>

              <section className="space-y-3">
                <h3 className="font-semibold text-primary">F. Tindakan yang Diinginkan / Permintaan</h3>
                <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3">{renderValue(selectedComplaint.requested_action)}</p>
              </section>

              <section className="space-y-3">
                <h3 className="font-semibold text-primary">G. Pernyataan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><span className="font-medium">Nama Pengadu:</span> {renderValue(selectedComplaint.declaration_name)}</div>
                  <div><span className="font-medium">Tanggal:</span> {renderValue(selectedComplaint.declaration_date)}</div>
                  <div><span className="font-medium">Tanda Tangan:</span> {renderValue(selectedComplaint.declaration_signature)}</div>
                  <div><span className="font-medium">Persetujuan:</span> {selectedComplaint.declaration_agreed ? 'Setuju' : 'Tidak'}</div>
                </div>
              </section>

              <section className="text-xs text-muted-foreground border-t pt-3">
                Dibuat pada: {formatDate(selectedComplaint.created_at, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </section>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
