import { useEffect, useState } from 'react';
import { api } from '@/db';
import type { Post } from '@/db';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface PostListPageProps {
  title: string;
  type: Post['type'];
  description: string;
}

export default function PostListPage({ title, type, description }: PostListPageProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.posts.list({ type, limit: 12 });
        setPosts(data);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [type]);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mb-12 space-y-4">
        <Badge variant="outline">Portal Isu PMI NU Malaysia</Badge>
        <h1 className="text-4xl font-bold text-primary border-l-4 border-primary pl-4">{title}</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">{description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          Array(6).fill(0).map((_, i) => <Card key={i} className="animate-pulse bg-muted h-[400px]" />)
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <Card key={post.id} className="overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
              <div className="aspect-video overflow-hidden bg-muted/40 p-2">
                <img src={post.image_url || 'https://via.placeholder.com/600x400'} alt={post.title} className="w-full h-full object-contain" />
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{post.category}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(post.published_at || post.created_at)}</span>
                </div>
                <CardTitle className="line-clamp-2">
                  <Link to={`/post/${post.slug}`} className="hover:text-primary transition-colors">{post.title}</Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="ghost" className="w-full text-primary">
                  <Link to={`/post/${post.slug}`}>Baca Selengkapnya</Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-muted-foreground">
            Belum ada konten untuk kategori ini.
          </div>
        )}
      </div>
    </div>
  );
}
