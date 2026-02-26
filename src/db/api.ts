import { supabase } from './supabase';

export type UserRole = 'admin' | 'user';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}

export type Post = {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  type: 'pmi_news' | 'activity' | 'inspiration' | 'opinion' | 'organization';
  category: string | null;
  image_url: string | null;
  author_id: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  profiles?: Profile;
};

export interface Complaint {
  id: string;
  name: string;
  contact: string;
  issue: string;
  status: 'pending' | 'in_progress' | 'resolved';
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  type: 'PCINU' | 'Banom';
  created_at: string;
}

export type Infographic = {
  id: string;
  title: string;
  image_url: string;
  description: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  data_value: number | null;
  data_type: string | null;
  created_at: string;
};

// API functions
export const api = {
  posts: {
    async list({ type, limit = 10, offset = 0, publishedOnly = true }: { type?: Post['type']; limit?: number; offset?: number; publishedOnly?: boolean }) {
      let query = supabase.from('posts').select('*, profiles(*)').order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      if (type) query = query.eq('type', type);
      if (publishedOnly) query = query.eq('is_published', true);
      const { data, error } = await query;
      if (error) throw error;
      return data as Post[];
    },
    async getBySlug(slug: string) {
      const { data, error } = await supabase.from('posts').select('*, profiles(*)').eq('slug', slug).maybeSingle();
      if (error) throw error;
      return data as Post | null;
    },
    async create(post: Partial<Post>) {
      const { data, error } = await supabase.from('posts').insert(post).select().single();
      if (error) throw error;
      return data as Post;
    },
    async update(id: string, updates: Partial<Post>) {
      const { data, error } = await supabase.from('posts').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as Post;
    },
    async delete(id: string) {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
    }
  },
  complaints: {
    async list() {
      const { data, error } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Complaint[];
    },
    async create(complaint: Omit<Complaint, 'id' | 'status' | 'created_at'>) {
      const { data, error } = await supabase.from('complaints').insert(complaint).select().single();
      if (error) throw error;
      return data as Complaint;
    },
    async updateStatus(id: string, status: Complaint['status']) {
      const { data, error } = await supabase.from('complaints').update({ status }).eq('id', id).select().single();
      if (error) throw error;
      return data as Complaint;
    }
  },
  organizations: {
    async list() {
      const { data, error } = await supabase.from('organizations').select('*').order('name');
      if (error) throw error;
      return data as Organization[];
    }
  },
  infographics: {
    async list() {
      const { data, error } = await supabase.from('infographics').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Infographic[];
    }
  },
  profiles: {
    async get(id: string) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    }
  }
};
