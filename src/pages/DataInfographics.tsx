import { useEffect, useMemo, useState } from 'react';
import { api, type ComplaintPublicSummary, type Infographic } from '@/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Users, UserRound, BriefcaseBusiness, CalendarDays, AlertCircle, CheckCircle2, Clock3, Info } from 'lucide-react';

const KPI_SIMULATION = {
  totalPMI: 1200000,
  male: 700000,
  female: 500000,
  topSector: 'Domestik',
  year: '2024',
};

const PMI_TREND_DATA = [
  { year: '2020', total: 920000 },
  { year: '2021', total: 980000 },
  { year: '2022', total: 1050000 },
  { year: '2023', total: 1130000 },
  { year: '2024', total: 1200000 },
];

export default function DataInfographics() {
  const [infographics, setInfographics] = useState<Infographic[]>([]);
  const [complaintSummary, setComplaintSummary] = useState<ComplaintPublicSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('internal');

  useEffect(() => {
    async function fetchData() {
      try {
        const [infographicResult, complaintResult] = await Promise.all([
          api.infographics.listPublicMalaysia(),
          api.complaints.publicSummary(),
        ]);

        setInfographics(infographicResult.items);
        setDataSource(infographicResult.meta.source || 'internal');
        setComplaintSummary(complaintResult);
      } catch (err) {
        console.error('Failed to fetch Data & Infografis:', err);
        try {
          const fallback = await api.infographics.list();
          setInfographics(fallback);
          setDataSource('internal-fallback');
        } catch (fallbackErr) {
          console.error('Failed to fetch fallback infographics:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const totalKasus = complaintSummary?.totals.total || 0;
  const kasusSelesai = complaintSummary?.totals.resolved || 0;
  const kasusDalamProses = (complaintSummary?.totals.in_progress || 0) + (complaintSummary?.totals.pending || 0);

  const complaintTrendData = useMemo(() => {
    if (!complaintSummary || complaintSummary.by_year.length === 0) {
      const currentYear = new Date().getFullYear();
      return [
        { year: String(currentYear - 2), count: 0 },
        { year: String(currentYear - 1), count: 0 },
        { year: String(currentYear), count: 0 },
      ];
    }
    return complaintSummary.by_year;
  }, [complaintSummary]);

  const caseByTypeRows = useMemo(() => {
    if (!complaintSummary || complaintSummary.by_type.length === 0) {
      return [];
    }
    return complaintSummary.by_type.slice(0, 8);
  }, [complaintSummary]);

  const nuActivityInfographics = useMemo(() => {
    return infographics.filter((item) => {
      const type = (item.data_type || '').toLowerCase();
      const title = (item.title || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      return (
        type.includes('kegiatan') ||
        title.includes('kegiatan') ||
        title.includes('banom') ||
        title.includes('nu') ||
        desc.includes('kegiatan')
      );
    });
  }, [infographics]);

  return (
    <div className="container mx-auto px-4 py-12 pb-24 max-w-6xl space-y-10">
      <div className="space-y-4 text-center">
        <Badge variant="outline">Dashboard Data PMI Malaysia</Badge>
        <h1 className="text-4xl font-bold text-primary">Data & Infografis</h1>
        <p className="text-muted-foreground max-w-3xl mx-auto">
          LOOK & FEEL halaman ini mengikuti gaya dashboard KP2MI, dengan data aduan diambil dari sistem NU Malaysia.
        </p>
        <div className="flex justify-center">
          <Badge variant="outline">Sumber data infografis: {dataSource === 'internal-fallback' ? 'Internal (fallback)' : dataSource}</Badge>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Referensi Data Publik</p>
            <p className="text-xs text-muted-foreground">Sumber acuan tampilan dan rujukan statistik umum: KP2MI 2024</p>
          </div>
          <a
            href="https://kp2mi.go.id/dashboard-publik"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-primary underline underline-offset-4"
          >
            Lihat Referensi KP2MI
          </a>
        </CardContent>
      </Card>

      <section className="space-y-5">
        <h2 className="text-2xl font-bold">🟢 Bagian 1 – Statistik Umum PMI Malaysia</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total PMI di Malaysia</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-2xl font-bold">{KPI_SIMULATION.totalPMI.toLocaleString('id-ID')}</div>
              <Users className="h-5 w-5 text-primary" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Laki-laki</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-2xl font-bold">{KPI_SIMULATION.male.toLocaleString('id-ID')}</div>
              <UserRound className="h-5 w-5 text-blue-600" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Perempuan</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-2xl font-bold">{KPI_SIMULATION.female.toLocaleString('id-ID')}</div>
              <UserRound className="h-5 w-5 text-pink-600" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Sektor Terbanyak</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-lg font-bold">{KPI_SIMULATION.topSector}</div>
              <BriefcaseBusiness className="h-5 w-5 text-amber-600" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tahun Data</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-2xl font-bold">{KPI_SIMULATION.year}</div>
              <CalendarDays className="h-5 w-5 text-emerald-600" />
            </CardContent>
          </Card>
        </div>
        <p className="text-xs text-muted-foreground">Sumber: KP2MI 2024</p>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-bold">🟢 Bagian 2 – Grafik Tren</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>📈 Jumlah PMI 2020–2024</CardTitle>
              <CardDescription>Grafik simulasi referensi visual dashboard KP2MI.</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={PMI_TREND_DATA}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => value.toLocaleString('id-ID')} />
                  <Line type="monotone" dataKey="total" stroke="#0f766e" strokeWidth={3} name="Jumlah PMI" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📊 Jumlah Kasus Pengaduan PMI per Tahun</CardTitle>
              <CardDescription>Data dari sistem aduan NU Malaysia.</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complaintTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#f59e0b" name="Jumlah Kasus" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-bold">🟢 Bagian 3 – Data Kasus & Penyelesaian</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-red-200 bg-red-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Kasus Diterima NU Malaysia</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-3xl font-bold text-red-700">{totalKasus.toLocaleString('id-ID')}</div>
              <AlertCircle className="h-6 w-6 text-red-600" />
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Kasus Selesai</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-3xl font-bold text-emerald-700">{kasusSelesai.toLocaleString('id-ID')}</div>
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Dalam Proses</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-3xl font-bold text-amber-700">{kasusDalamProses.toLocaleString('id-ID')}</div>
              <Clock3 className="h-6 w-6 text-amber-600" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tabel Ringkasan Jenis Kasus</CardTitle>
            <CardDescription>Data ini berasal dari sistem aduan NU Malaysia, bukan dari KP2MI.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-sm text-muted-foreground">Memuat data kasus...</div>
            ) : caseByTypeRows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="px-3 py-2">Jenis Kasus</th>
                      <th className="px-3 py-2">Jumlah</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caseByTypeRows.map((row) => (
                      <tr key={row.type} className="border-b last:border-0">
                        <td className="px-3 py-2 font-medium">{row.type}</td>
                        <td className="px-3 py-2">{row.total}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.resolved} selesai • {row.in_progress + row.pending} proses</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-sm text-muted-foreground">Belum ada data aduan. Silakan input aduan dari modul Advokasi.</div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Infografis Kegiatan NU</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {nuActivityInfographics.slice(0, 6).map((info) => (
            <Card key={info.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg line-clamp-1">{info.title}</CardTitle>
                <CardDescription className="line-clamp-2">{info.description || 'Infografis kegiatan NU Malaysia.'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video overflow-hidden rounded border bg-muted/30 p-2">
                  <img src={info.image_url} alt={info.title} className="w-full h-full object-contain" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {nuActivityInfographics.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada infografis kegiatan NU. Tambahkan manual dari dashboard admin.</p>
        )}
      </section>

      <div className="rounded-xl border bg-muted/50 p-4 text-xs text-muted-foreground flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5" />
        <p>
          Catatan: Statistik umum PMI adalah simulasi presentasi berbasis referensi KP2MI 2024. Data kasus & penyelesaian ditarik dari sistem aduan internal NU Malaysia.
        </p>
      </div>
    </div>
  );
}
