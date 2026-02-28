import { useEffect, useState } from 'react';
import { api, type Infographic } from '@/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Share2, Info, MapPin, Users, Scale, HandHeart, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  const getDataTypeLabel = (type: string | null) => {
    switch (type) {
      case 'jumlah_pmi': return 'Jumlah PMI';
      case 'kasus_hukum': return 'Kasus Hukum';
      case 'bantuan_advokasi': return 'Bantuan Advokasi';
      default: return 'Data';
    }
  };

  const getDataTypeIcon = (type: string | null) => {
    switch (type) {
      case 'jumlah_pmi': return <Users className="h-5 w-5" />;
      case 'kasus_hukum': return <Scale className="h-5 w-5" />;
      case 'bantuan_advokasi': return <HandHeart className="h-5 w-5" />;
      default: return <TrendingUp className="h-5 w-5" />;
    }
  };

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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
      </div>

      <Tabs defaultValue="map" className="space-y-8">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="map">Peta Interaktif</TabsTrigger>
          <TabsTrigger value="infografis">Infografis</TabsTrigger>
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
              <div className="relative w-full h-[500px] bg-muted rounded-lg overflow-hidden">
                {/* Google Maps Embed */}
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src="https://www.google.com/maps/embed/v1/view?key=AIzaSyB_LJOYJL-84SMuxNB7LtRGhxEQLjswvy0&center=4.2105,101.9758&zoom=6&language=id&region=my"
                />
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

        <TabsContent value="infografis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {loading ? (
              Array(2).fill(0).map((_, i) => <Card key={i} className="animate-pulse bg-muted h-[400px]" />)
            ) : infographics.filter(i => i.image_url).map((info) => (
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

          {infographics.length === 0 && !loading && (
            <div className="py-20 text-center text-muted-foreground border-2 border-dashed rounded-xl">
              Belum ada data infografis yang tersedia saat ini.
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
