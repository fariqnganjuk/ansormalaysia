import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type ExternalNews, type Post } from '@/db';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

type InternalNewsItem = {
  id: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  category: string | null;
  date: string;
  sourceName: 'ANSOR Malaysia';
  kind: 'internal';
  href: string;
};

type ExternalNewsItem = {
  id: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  category: string | null;
  date: string;
  sourceName: string;
  kind: 'external';
  href: string;
};

type UnifiedNewsItem = InternalNewsItem | ExternalNewsItem;

function toInternal(item: Post): InternalNewsItem {
  return {
    id: `internal-${item.id}`,
    title: item.title,
    excerpt: item.excerpt,
    image_url: item.image_url,
    category: item.category,
    date: item.published_at || item.created_at,
    sourceName: 'ANSOR Malaysia',
    kind: 'internal',
    href: `/post/${item.slug}`,
  };
}

function toExternal(item: ExternalNews): ExternalNewsItem {
  return {
    id: `external-${item.id}`,
    title: item.title,
    excerpt: item.excerpt,
    image_url: item.image_url,
    category: 'Sumber Eksternal',
    date: item.published_at || item.created_at,
    sourceName: item.source_name,
    kind: 'external',
    href: item.source_link,
  };
}

export default function NewsList() {
  const [internalNews, setInternalNews] = useState<Post[]>([]);
  const [externalNews, setExternalNews] = useState<ExternalNews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [internal, external] = await Promise.all([
          api.posts.list({ type: 'pmi_news', limit: 18 }),
          api.externalNews.listPublic(30),
        ]);

        setInternalNews(internal);
        setExternalNews(external.items);
      } catch (err) {
        console.error('Failed to fetch news:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const items = useMemo<UnifiedNewsItem[]>(() => {
    const merged = [...internalNews.map(toInternal), ...externalNews.map(toExternal)];
    return merged.sort((a, b) => {
      const ad = new Date(a.date).getTime();
      const bd = new Date(b.date).getTime();
      return bd - ad;
    });
  }, [internalNews, externalNews]);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mb-12 space-y-4">
        <Badge variant="outline">Portal Isu PMI NU Malaysia</Badge>
        <h1 className="text-4xl font-bold text-primary border-l-4 border-primary pl-4">Berita PMI & Isu Migran</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Update terkini dari konten internal ANSOR Malaysia dan sumber eksternal terpercaya (Kompas, NU Online, Detik).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          Array(6).fill(0).map((_, i) => <Card key={i} className="animate-pulse bg-muted h-[400px]" />)
        ) : items.length > 0 ? (
          items.map((item) => (
            <Card key={item.id} className="overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
              <div className="aspect-video overflow-hidden bg-muted/40 p-2">
                <img src={item.image_url || 'https://via.placeholder.com/600x400'} alt={item.title} className="w-full h-full object-contain" />
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant={item.kind === 'internal' ? 'secondary' : 'outline'}>{item.category || 'Berita'}</Badge>
                  <Badge variant="outline">{item.sourceName}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                </div>
                <CardTitle className="line-clamp-2">
                  {item.kind === 'internal' ? (
                    <Link to={item.href} className="hover:text-primary transition-colors">{item.title}</Link>
                  ) : (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                      {item.title}
                    </a>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">{item.excerpt || 'Ringkasan tidak tersedia.'}</p>
              </CardContent>
              <CardFooter>
                {item.kind === 'internal' ? (
                  <Button asChild variant="ghost" className="w-full text-primary">
                    <Link to={item.href}>Baca Selengkapnya</Link>
                  </Button>
                ) : (
                  <Button asChild variant="ghost" className="w-full text-primary">
                    <a href={item.href} target="_blank" rel="noopener noreferrer">Baca Selengkapnya (Sumber Asli)</a>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-muted-foreground">
            Belum ada konten berita untuk ditampilkan.
          </div>
        )}
      </div>
    </div>
  );
}
