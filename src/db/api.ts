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
  type: 'pmi_news' | 'activity' | 'inspiration' | 'opinion';
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
  id_number?: string | null;
  birth_date?: string | null;
  malaysia_address?: string | null;
  phone_whatsapp?: string | null;
  email?: string | null;
  employer_name?: string | null;
  employer_address?: string | null;
  job_type?: string | null;
  work_duration?: string | null;
  complaint_types?: string[];
  complaint_other?: string | null;
  chronology?: string | null;
  evidence_url?: string | null;
  requested_action?: string | null;
  declaration_name?: string | null;
  declaration_date?: string | null;
  declaration_signature?: string | null;
  declaration_agreed?: boolean;
  status: 'pending' | 'in_progress' | 'resolved';
  created_at: string;
}

export interface ComplaintSubmission {
  full_name: string;
  id_number?: string;
  birth_date?: string;
  malaysia_address?: string;
  phone_whatsapp?: string;
  email?: string;
  employer_name?: string;
  employer_address?: string;
  job_type?: string;
  work_duration?: string;
  complaint_types?: string[];
  complaint_other?: string;
  chronology: string;
  evidence_url?: string;
  requested_action?: string;
  declaration_name?: string;
  declaration_date?: string;
  declaration_signature?: string;
  declaration_agreed: boolean;
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

export type PublicInfographicListMeta = {
  source: string;
  external_available: boolean;
  external_error: string | null;
  updated_at: string | null;
  refresh?: boolean;
};

export interface AppUser {
  id: string;
  email: string | null;
  username?: string | null;
}

export interface UserAccount {
  id: string;
  username: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}

export interface ExternalNews {
  id: string;
  source_name: string;
  source_link: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string | null;
  created_at: string;
}

const defaultApiBaseUrl = (() => {
  if (typeof window === 'undefined') {
    return 'http://localhost/ANSORMALAYSIA/backend';
  }

  const protocol = window.location.protocol || 'http:';
  const hostname = window.location.hostname || 'localhost';
  return `${protocol}//${hostname}/ANSORMALAYSIA/backend`;
})();

function normalizeApiBaseUrl(rawUrl: string): string {
  const sanitized = rawUrl.replace(/\/$/, '');

  if (typeof window === 'undefined') {
    return sanitized;
  }

  try {
    const parsed = new URL(sanitized);
    const currentHost = window.location.hostname;
    const currentProtocol = window.location.protocol || parsed.protocol;
    const localHosts = new Set(['localhost', '127.0.0.1', '::1']);

    if (localHosts.has(parsed.hostname) && localHosts.has(currentHost) && parsed.hostname !== currentHost) {
      const portSegment = parsed.port ? `:${parsed.port}` : '';
      return `${currentProtocol}//${currentHost}${portSegment}${parsed.pathname}`.replace(/\/$/, '');
    }
  } catch {
    return sanitized;
  }

  return sanitized;
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl);
const AUTH_TOKEN_KEY = 'ansor_auth_token';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function setAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return;

  if (!token) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return;
  }

  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
};

async function request<T>(route: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method || 'GET';
  const params = new URLSearchParams();
  params.set('route', route.startsWith('/') ? route : `/${route}`);

  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value === undefined || value === null) continue;
      params.set(key, String(value));
    }
  }

  const token = getAuthToken();
  const headers: Record<string, string> = {};

  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/index.php?${params.toString()}`, {
    method,
    credentials: 'include',
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    if (response.status === 401) {
      setAuthToken(null);
    }

    const message = data?.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

function normalizePost(post: any): Post {
  return {
    ...post,
    id: String(post.id),
    author_id: post.author_id !== null && post.author_id !== undefined ? String(post.author_id) : null,
    is_published: Boolean(post.is_published),
    profiles: post.profiles
      ? {
          ...post.profiles,
          id: String(post.profiles.id),
        }
      : undefined,
  };
}

function normalizeComplaint(complaint: any): Complaint {
  return {
    ...complaint,
    id: String(complaint.id),
    complaint_types: Array.isArray(complaint.complaint_types) ? complaint.complaint_types.map(String) : [],
    declaration_agreed: Boolean(complaint.declaration_agreed),
  };
}

function normalizeOrganization(organization: any): Organization {
  return {
    ...organization,
    id: String(organization.id),
  };
}

function normalizeInfographic(infographic: any): Infographic {
  return {
    ...infographic,
    id: String(infographic.id),
    latitude: infographic.latitude === null ? null : Number(infographic.latitude),
    longitude: infographic.longitude === null ? null : Number(infographic.longitude),
    data_value: infographic.data_value === null ? null : Number(infographic.data_value),
  };
}

function normalizeUserAccount(user: any): UserAccount {
  return {
    ...user,
    id: String(user.id),
  };
}

function normalizeExternalNews(item: any): ExternalNews {
  return {
    ...item,
    id: String(item.id),
  };
}

// API functions
export const api = {
  auth: {
    async session() {
      const result = await request<{ user: AppUser | null; profile: Profile | null }>('/auth/session');
      if (!result.user) {
        setAuthToken(null);
      }
      return result;
    },
    async login(username: string, password: string) {
      const result = await request<{ user: AppUser; profile: Profile; token?: string }>('/auth/login', {
        method: 'POST',
        body: { username, password },
      });

      if (result.token) {
        setAuthToken(result.token);
      }

      return {
        user: {
          ...result.user,
          id: String(result.user.id),
        },
        profile: {
          ...result.profile,
          id: String(result.profile.id),
        },
      };
    },
    async register(username: string, password: string) {
      const result = await request<{ user: AppUser; profile: Profile; token?: string }>('/auth/register', {
        method: 'POST',
        body: { username, password },
      });

      if (result.token) {
        setAuthToken(result.token);
      }

      return {
        user: {
          ...result.user,
          id: String(result.user.id),
        },
        profile: {
          ...result.profile,
          id: String(result.profile.id),
        },
      };
    },
    async logout() {
      try {
        await request('/auth/logout', { method: 'POST' });
      } finally {
        setAuthToken(null);
      }
    },
  },
  posts: {
    async list({ type, limit = 10, offset = 0, publishedOnly = true }: { type?: Post['type']; limit?: number; offset?: number; publishedOnly?: boolean }) {
      const data = await request<any[]>('/posts', {
        query: { type, limit, offset, publishedOnly },
      });

      return data.map(normalizePost);
    },
    async getBySlug(slug: string) {
      const data = await request<any | null>(`/posts/slug/${encodeURIComponent(slug)}`);
      return data ? normalizePost(data) : null;
    },
    async create(post: Partial<Post>) {
      const data = await request<any>('/posts', {
        method: 'POST',
        body: post,
      });

      return normalizePost(data);
    },
    async update(id: string, updates: Partial<Post>) {
      const data = await request<any>(`/posts/${id}`, {
        method: 'PUT',
        body: updates,
      });

      return normalizePost(data);
    },
    async delete(id: string) {
      await request(`/posts/${id}`, { method: 'DELETE' });
    }
  },
  complaints: {
    async list() {
      const data = await request<any[]>('/complaints');
      return data.map(normalizeComplaint);
    },
    async create(complaint: ComplaintSubmission) {
      const data = await request<any>('/complaints', {
        method: 'POST',
        body: complaint,
      });

      return normalizeComplaint(data);
    },
    async updateStatus(id: string, status: Complaint['status']) {
      const data = await request<any>(`/complaints/${id}/status`, {
        method: 'PATCH',
        body: { status },
      });

      return normalizeComplaint(data);
    }
  },
  organizations: {
    async list() {
      const data = await request<any[]>('/organizations');
      return data.map(normalizeOrganization);
    },
    async create(organization: Pick<Organization, 'name' | 'type'> & Partial<Pick<Organization, 'description' | 'logo_url'>>) {
      const data = await request<any>('/organizations', {
        method: 'POST',
        body: organization,
      });

      return normalizeOrganization(data);
    },
    async update(id: string, updates: Partial<Organization>) {
      const data = await request<any>(`/organizations/${id}`, {
        method: 'PUT',
        body: updates,
      });

      return normalizeOrganization(data);
    },
    async delete(id: string) {
      await request(`/organizations/${id}`, { method: 'DELETE' });
    },
  },
  infographics: {
    async list() {
      const data = await request<any[]>('/infographics');
      return data.map(normalizeInfographic);
    },
    async create(infographic: Omit<Infographic, 'id' | 'created_at'>) {
      const data = await request<any>('/infographics', {
        method: 'POST',
        body: infographic,
      });

      return normalizeInfographic(data);
    },
    async update(id: string, updates: Partial<Infographic>) {
      const data = await request<any>(`/infographics/${id}`, {
        method: 'PUT',
        body: updates,
      });

      return normalizeInfographic(data);
    },
    async delete(id: string) {
      await request(`/infographics/${id}`, { method: 'DELETE' });
    },
    async listPublicMalaysia(options?: { refresh?: boolean }) {
      const data = await request<{ items: any[]; meta: PublicInfographicListMeta }>('/infographics/public', {
        query: {
          refresh: options?.refresh ? '1' : undefined,
        },
      });
      return {
        items: (data.items || []).map(normalizeInfographic),
        meta: data.meta,
      };
    },
  },
  profiles: {
    async get(id: string) {
      const data = await request<any | null>(`/profiles/${id}`);
      if (!data) return null;
      return {
        ...data,
        id: String(data.id),
      } as Profile;
    }
  },
  users: {
    async list() {
      const data = await request<any[]>('/users');
      return data.map(normalizeUserAccount);
    },
    async create(user: { username: string; email?: string; full_name?: string; avatar_url?: string; role?: UserRole; password: string }) {
      const data = await request<any>('/users', {
        method: 'POST',
        body: user,
      });

      return normalizeUserAccount(data);
    },
    async update(id: string, updates: Partial<UserAccount> & { password?: string }) {
      const data = await request<any>(`/users/${id}`, {
        method: 'PUT',
        body: updates,
      });

      return normalizeUserAccount(data);
    },
    async delete(id: string) {
      await request(`/users/${id}`, { method: 'DELETE' });
    },
  },
  externalNews: {
    async listPublic(limit = 20) {
      const data = await request<{ items: any[]; meta: { count: number } }>('/external-news/public', {
        query: { limit },
      });

      return {
        items: (data.items || []).map(normalizeExternalNews),
        meta: data.meta,
      };
    },
    async refresh() {
      return request<{ ok: boolean; processed: number; updated_at: string }>('/external-news/refresh', {
        method: 'POST',
      });
    },
  },
  uploads: {
    async image(file: File) {
      const formData = new FormData();
      formData.append('file', file);

      const params = new URLSearchParams();
      params.set('route', '/upload/image');

      const response = await fetch(`${API_BASE_URL}/index.php?${params.toString()}`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : undefined,
        body: formData,
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      if (!response.ok) {
        const message = data?.error || `HTTP ${response.status}`;
        throw new Error(message);
      }

      return data as { url: string };
    },
    async publicAttachment(file: File) {
      const formData = new FormData();
      formData.append('file', file);

      const params = new URLSearchParams();
      params.set('route', '/upload/public-attachment');

      const response = await fetch(`${API_BASE_URL}/index.php?${params.toString()}`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      if (!response.ok) {
        const message = data?.error || `HTTP ${response.status}`;
        throw new Error(message);
      }

      return data as { url: string };
    }
  }
};
