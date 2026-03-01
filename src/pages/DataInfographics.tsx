import { useEffect, useState } from 'react';
import { api, type Infographic } from '@/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Share2, Info, MapPin, Users, Scale, HandHeart, TrendingUp, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const MALAYSIA_BOUNDS = {
  minLat: 0,
  maxLat: 8,
  minLng: 99,
  maxLng: 120,
};

const CHART_COLORS = ['#0f766e', '#f59e0b', '#16a34a', '#dc2626', '#3b82f6', '#8b5cf6'];

function clampPercent(value: number, min = 5, max = 95) {
  return Math.max(min, Math.min(max, value));
}

function toGeoPosition(lat: number | null, lng: number | null, fallbackIndex: number) {
  if (lat === null || lng === null || Number.isNaN(lat) || Number.isNaN(lng)) {
    const col = fallbackIndex % 4;
    const row = Math.floor(fallbackIndex / 4);
    return {
      left: 18 + col * 20,
      top: 20 + row * 18,
    };
  }

  const lngRatio = (lng - MALAYSIA_BOUNDS.minLng) / (MALAYSIA_BOUNDS.maxLng - MALAYSIA_BOUNDS.minLng);
  const latRatio = (lat - MALAYSIA_BOUNDS.minLat) / (MALAYSIA_BOUNDS.maxLat - MALAYSIA_BOUNDS.minLat);

  return {
    left: clampPercent(lngRatio * 100),
    top: clampPercent((1 - latRatio) * 100),
  };
}

function monthKey(dateText: string) {
  const d = new Date(dateText);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
}

function getDataTypeLabel(type: string | null) {
  switch (type) {
    case 'jumlah_pmi': return 'Jumlah PMI';
    case 'kasus_hukum': return 'Kasus Hukum';
    case 'bantuan_advokasi': return 'Bantuan Advokasi';
    default: return 'Data';
  }
}

function getDataTypeIcon(type: string | null) {
  switch (type) {
    case 'jumlah_pmi': return <Users className="h-5 w-5" />;
    case 'kasus_hukum': return <Scale className="h-5 w-5" />;
    case 'bantuan_advokasi': return <HandHeart className="h-5 w-5" />;
    default: return <TrendingUp className="h-5 w-5" />;
  }
}

export default function DataInfographics() {
  const [infographics, setInfographics] = useState<Infographic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Infographic | null>(null);
  const [dataSource, setDataSource] = useState<string>('internal');

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await api.infographics.listPublicMalaysia();
        setInfographics(result.items);
        setDataSource(result.meta.source || 'internal');
      } catch (err) {
        console.error('Failed to fetch public malaysia infographics:', err);
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

  // Group data by location
  const locationData = infographics.reduce<Record<string, { name: string; lat: number | null; lng: number | null; data: Infographic[] }>>((acc, item) => {
    if (item.location_name) {
      if (!acc[item.location_name]) {
        acc[item.location_name] = {
          name: item.location_name,
          lat: item.latitude,
          lng: item.longitude,
          data: []
        };
      }
      acc[item.location_name].data.push(item);
    }
    return acc;
  }, {});

  const locations = Object.values(locationData);
  const selectedLocationName = selectedLocation?.location_name || locations[0]?.name || null;
  const selectedLocationItems = selectedLocationName ? locationData[selectedLocationName]?.data || [] : [];

  // Calculate totals
  const totalPMI = infographics
    .filter(i => i.data_type === 'jumlah_pmi')
    .reduce((sum, i) => sum + (i.data_value || 0), 0);

  const totalKasus = infographics
    .filter(i => i.data_type === 'kasus_hukum')
    .reduce((sum, i) => sum + (i.data_value || 0), 0);

  const totalBantuan = infographics
    .filter(i => i.data_type === 'bantuan_advokasi')
    .reduce((sum, i) => sum + (i.data_value || 0), 0);

  const totalKasusDilaporkan = infographics
    .filter((item) => {
      const type = (item.data_type || '').toLowerCase();
      const title = (item.title || '').toLowerCase();
      return type.includes('kasus') || title.includes('kasus');
    })
    .reduce((sum, item) => sum + (item.data_value || 0), 0);

  const kasusSelesaiRaw = infographics
    .filter((item) => {
      const type = (item.data_type || '').toLowerCase();
      const title = (item.title || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      return (
        type.includes('selesai') ||
        type.includes('resolved') ||
        title.includes('selesai') ||
        title.includes('ditangani') ||
        desc.includes('selesai') ||
        desc.includes('tuntas')
      );
    })
    .reduce((sum, item) => sum + (item.data_value || 0), 0);

  const kasusSelesai = kasusSelesaiRaw > 0 ? kasusSelesaiRaw : totalBantuan;
  const kasusAktif = Math.max(totalKasusDilaporkan - kasusSelesai, 0);

  const lastUpdatedAt = infographics.reduce<string | null>((latest, item) => {
    if (!item.created_at) return latest;
    if (!latest) return item.created_at;
    return new Date(item.created_at).getTime() > new Date(latest).getTime() ? item.created_at : latest;
  }, null);

  const migrationStatsData = selectedLocationItems
    .filter(item => item.data_value !== null)
    .map((item, index) => ({
      name: getDataTypeLabel(item.data_type),
      value: item.data_value || 0,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));

  const trendAccumulator = selectedLocationItems.reduce<Record<string, { month: string; total: number; kasus: number; advokasi: number }>>((acc, item) => {
    const key = monthKey(item.created_at);
    if (!acc[key]) {
      acc[key] = { month: key, total: 0, kasus: 0, advokasi: 0 };
    }

    acc[key].total += item.data_value || 0;
    if (item.data_type === 'kasus_hukum') acc[key].kasus += item.data_value || 0;
    if (item.data_type === 'bantuan_advokasi') acc[key].advokasi += item.data_value || 0;
    return acc;
  }, {});

  const trendData = Object.values(trendAccumulator);

  const nuActivities = (selectedLocationName ? selectedLocationItems : infographics).filter((item) => {
    const title = (item.title || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();
    const type = (item.data_type || '').toLowerCase();
    return type.includes('kegiatan') || title.includes('kegiatan') || title.includes('banom') || title.includes('nu') || desc.includes('kegiatan');
  });

  return (
    <div className="container mx-auto px-4 py-12 pb-24 max-w-6xl space-y-12">
      <div className="text-center mb-16 space-y-4">
        <div className="flex justify-center">
          <Badge variant="outline">Pusat Data PMI Malaysia</Badge>
        </div>
        <h1 className="text-4xl font-bold text-primary">Data & Infografis PMI</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Visualisasi data dan statistik mengenai kondisi Pekerja Migran Indonesia di Malaysia berdasarkan lokasi geografis
        </p>
        <div className="flex justify-center">
          <Badge variant="outline">Sumber data: {dataSource === 'internal-fallback' ? 'Internal (fallback)' : dataSource}</Badge>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-primary">Referensi Dashboard KP2MI</p>
              <p className="text-xs text-muted-foreground">
                Data ditampilkan dengan struktur visual mengacu referensi KP2MI, dengan sumber utama eksternal bila tersedia dan fallback data manual internal.
              </p>
            </div>
            <a
              href="https://kp2mi.go.id/dashboard-publik"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-primary underline underline-offset-4"
            >
              Buka Referensi KP2MI
            </a>
          </div>
          {lastUpdatedAt && (
            <p className="mt-3 text-[11px] text-muted-foreground">
              Pembaruan data terakhir: {new Date(lastUpdatedAt).toLocaleString('id-ID')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-12">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total PMI</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{totalPMI.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground mt-1">Pekerja di seluruh Malaysia</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kasus Hukum</CardTitle>
            <Scale className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{totalKasus.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground mt-1">Kasus yang ditangani</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bantuan Diberikan</CardTitle>
            <HandHeart className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{totalBantuan.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground mt-1">Layanan advokasi</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Kasus</CardTitle>
            <AlertCircle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{totalKasusDilaporkan.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground mt-1">Kasus dilaporkan</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kasus Selesai</CardTitle>
            <Scale className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{kasusSelesai.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground mt-1">Telah diselesaikan</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kasus Aktif</CardTitle>
            <TrendingUp className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{kasusAktif.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground mt-1">Masih dalam proses</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="map" className="space-y-8">
        <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-4">
          <TabsTrigger value="map">Peta Interaktif</TabsTrigger>
          <TabsTrigger value="stats">Statistik PMI & Migrasi</TabsTrigger>
          <TabsTrigger value="trend">Peta Isu & Grafik Trend</TabsTrigger>
          <TabsTrigger value="infografis">Infografis Kegiatan NU</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-6">
          {/* Interactive Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Peta Sebaran PMI di Malaysia
              </CardTitle>
              <CardDescription>Klik lokasi untuk melihat detail data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-[520px] rounded-lg overflow-hidden border bg-gradient-to-br from-emerald-50 via-sky-50 to-cyan-50">
                <div className="absolute inset-0 opacity-70 bg-[linear-gradient(to_right,#dbeafe_1px,transparent_1px),linear-gradient(to_bottom,#dbeafe_1px,transparent_1px)] bg-[size:28px_28px]" />
                <div className="absolute left-4 top-4 z-10 rounded-md bg-white/85 px-3 py-2 text-xs text-muted-foreground shadow">
                  Geotag PMI Malaysia (input manual) • klik titik untuk detail
                </div>

                {locations.map((location, index) => {
                  const point = toGeoPosition(location.lat, location.lng, index);
                  const isSelected = selectedLocationName === location.name;
                  const pmiData = location.data.find(d => d.data_type === 'jumlah_pmi');

                  return (
                    <button
                      key={location.name}
                      type="button"
                      onClick={() => setSelectedLocation(pmiData || location.data[0])}
                      className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow transition-all ${isSelected ? 'h-5 w-5 border-primary bg-primary scale-125' : 'h-4 w-4 border-primary/80 bg-white hover:scale-110'}`}
                      style={{ left: `${point.left}%`, top: `${point.top}%` }}
                      title={`${location.name}${pmiData ? ` • ${pmiData.data_value?.toLocaleString('id-ID')} PMI` : ''}`}
                    />
                  );
                })}
              </div>

              {/* Location Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
                {locations.map((location) => {
                  const pmiData = location.data.find(d => d.data_type === 'jumlah_pmi');
                  return (
                    <button
                      key={location.name}
                      onClick={() => setSelectedLocation(pmiData || location.data[0])}
                      className="p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <Badge variant="secondary" className="text-xs">
                          {location.data.length} data
                        </Badge>
                      </div>
                      <div className="font-semibold text-sm">{location.name}</div>
                      {pmiData && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {pmiData.data_value?.toLocaleString('id-ID')} PMI
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Location Detail */}
              {selectedLocation && (
                <Card className="mt-6 border-primary/50 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      {selectedLocation.location_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {getDataTypeIcon(selectedLocation.data_type)}
                        <span className="font-semibold">{getDataTypeLabel(selectedLocation.data_type)}</span>
                      </div>
                      <div className="text-3xl font-bold text-primary">
                        {selectedLocation.data_value?.toLocaleString('id-ID')}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{selectedLocation.description}</p>
                    </div>

                    {/* Show all data for this location */}
                    {locationData[selectedLocation.location_name!] && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t">
                        {locationData[selectedLocation.location_name!].data.map((item) => (
                          <div key={item.id} className="p-3 bg-background rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              {getDataTypeIcon(item.data_type)}
                              <span className="text-xs font-medium">{getDataTypeLabel(item.data_type)}</span>
                            </div>
                            <div className="text-xl font-bold">{item.data_value?.toLocaleString('id-ID')}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistik PMI & Migrasi {selectedLocationName ? `• ${selectedLocationName}` : ''}</CardTitle>
              <CardDescription>Berbasis input manual pada modul admin infografis per lokasi.</CardDescription>
            </CardHeader>
            <CardContent className="h-[360px]">
              {migrationStatsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={migrationStatsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => value.toLocaleString('id-ID')} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {migrationStatsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full rounded-xl border border-dashed flex items-center justify-center text-sm text-muted-foreground">
                  Belum ada data statistik untuk lokasi terpilih.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trend" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Peta Isu & Grafik Trend {selectedLocationName ? `• ${selectedLocationName}` : ''}</CardTitle>
              <CardDescription>Trend kasus hukum, bantuan advokasi, dan total nilai data per periode.</CardDescription>
            </CardHeader>
            <CardContent className="h-[360px]">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => value.toLocaleString('id-ID')} />
                    <Legend />
                    <Line type="monotone" dataKey="kasus" stroke="#f97316" strokeWidth={2} name="Kasus Hukum" />
                    <Line type="monotone" dataKey="advokasi" stroke="#16a34a" strokeWidth={2} name="Bantuan Advokasi" />
                    <Line type="monotone" dataKey="total" stroke="#0f766e" strokeWidth={2} name="Total" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full rounded-xl border border-dashed flex items-center justify-center text-sm text-muted-foreground">
                  Belum ada data trend untuk lokasi terpilih.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="infografis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {loading ? (
              Array(2).fill(0).map((_, i) => <Card key={i} className="animate-pulse bg-muted h-[400px]" />)
            ) : nuActivities.filter(i => i.image_url).map((info) => (
              <Card key={info.id} className="overflow-hidden shadow-lg border-primary/10">
                <CardHeader className="bg-muted/30">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    {info.location_name && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {info.location_name}
                      </Badge>
                    )}
                    {info.data_type && (
                      <Badge variant="outline">
                        {getDataTypeLabel(info.data_type)}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl font-bold">{info.title}</CardTitle>
                  <CardDescription className="line-clamp-2 italic">{info.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="w-full aspect-video bg-muted/40 overflow-hidden p-2">
                    <img 
                      src={info.image_url} 
                      alt={info.title} 
                      className="w-full h-full object-contain cursor-pointer" 
                      onClick={() => window.open(info.image_url, '_blank')} 
                    />
                  </div>
                </CardContent>
                <div className="p-4 bg-background flex items-center justify-between border-t">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                    <Info className="h-4 w-4" /> Sumber Data Terverifikasi
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={info.image_url} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" /> Download
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4 mr-2" /> Share
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {nuActivities.length === 0 && !loading && (
            <div className="py-20 text-center text-muted-foreground border-2 border-dashed rounded-xl">
              Belum ada infografis kegiatan NU untuk lokasi ini. Silakan isi manual di admin infografis dengan tag data_type seperti "kegiatan_nu".
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="p-8 bg-muted/50 rounded-2xl border flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 space-y-4">
          <h2 className="text-2xl font-bold text-primary">Bagi Peneliti & Akademisi</h2>
          <p className="text-muted-foreground">
            NU Malaysia menyediakan data statistik sekunder untuk keperluan riset dan kebijakan perlindungan PMI. Silakan hubungi tim data kami untuk permohonan akses data lebih mendalam.
          </p>
          <Button variant="outline" asChild>
            <Link to="/kontak">Hubungi Tim Data</Link>
          </Button>
        </div>
        <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
          <Info className="h-16 w-16 text-primary" />
        </div>
      </div>
    </div>
  );
}
