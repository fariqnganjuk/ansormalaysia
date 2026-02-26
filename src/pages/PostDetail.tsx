import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/db';
import type { Post } from '@/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, User, Calendar, Tag } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function PostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!slug) return;
      try {
        const data = await api.posts.getBySlug(slug);
        setPost(data);
      } catch (err) {
        console.error('Failed to fetch post detail:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Konten tidak ditemukan.</h1>
        <Button asChild variant="link" className="mt-4">
          <Link to="/">Kembali ke Beranda</Link>
        </Button>
      </div>
    );
  }

  return (
    <article className="container mx-auto px-4 py-12 max-w-4xl bg-white shadow-sm rounded-lg my-12">
      <Button asChild variant="ghost" size="sm" className="mb-8 hover:text-primary">
        <Link to={-1 as any}><ArrowLeft className="mr-2 h-4 w-4" /> Kembali</Link>
      </Button>

      <header className="space-y-6 mb-8">
        <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
          <Badge variant="outline" className="text-primary border-primary">{post.type.replace('_', ' ').toUpperCase()}</Badge>
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {formatDate(post.published_at || post.created_at)}</span>
          <span className="flex items-center gap-1"><Tag className="h-4 w-4" /> {post.category}</span>
          {post.profiles?.full_name && <span className="flex items-center gap-1"><User className="h-4 w-4" /> {post.profiles.full_name}</span>}
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-primary leading-tight">{post.title}</h1>
        {post.excerpt && <p className="text-xl text-muted-foreground italic border-l-4 border-accent pl-4">{post.excerpt}</p>}
      </header>

      {post.image_url && (
        <div className="aspect-video w-full overflow-hidden rounded-xl mb-12 shadow-md">
          <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="prose prose-lg max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
        {post.content}
      </div>

      <Separator className="my-12" />

      <footer className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
        <div>Diterbitkan pada: {formatDate(post.published_at || post.created_at, { hour: '2-digit', minute: '2-digit' })}</div>
        <div className="flex gap-4">
          <Button variant="outline" size="sm">Share to Facebook</Button>
          <Button variant="outline" size="sm">Share to WhatsApp</Button>
        </div>
      </footer>
    </article>
  );
}
