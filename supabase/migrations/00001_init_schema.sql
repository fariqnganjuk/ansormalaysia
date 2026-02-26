-- Enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'user');

-- Profiles table
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  email text,
  full_name text,
  avatar_url text,
  role public.user_role DEFAULT 'user'::public.user_role,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Admin helper
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid AND p.role = 'admin'::public.user_role
  );
$$;

-- Sync auth users to profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
user_count int;
BEGIN
SELECT COUNT(*) INTO user_count FROM profiles;
INSERT INTO public.profiles (id, email, role)
VALUES (
  NEW.id,
  NEW.email,
  CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
);
RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- Posts table
CREATE TABLE public.posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text,
  excerpt text,
  type text NOT NULL, -- 'pmi_news', 'activity', 'inspiration', 'opinion', 'organization'
  category text,
  image_url text,
  author_id uuid REFERENCES public.profiles(id),
  is_published boolean DEFAULT false,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Complaints table
CREATE TABLE public.complaints (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  contact text NOT NULL,
  issue text NOT NULL,
  status text DEFAULT 'pending' NOT NULL, -- 'pending', 'in_progress', 'resolved'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Organizations table
CREATE TABLE public.organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  logo_url text,
  type text NOT NULL, -- 'PCINU', 'Banom'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Infographics table
CREATE TABLE public.infographics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  image_url text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infographics ENABLE ROW LEVEL SECURITY;

-- Profiles: Admin full access, users view/update own
CREATE POLICY "Admins have full access to profiles" ON profiles FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

-- Posts: Everyone view published, admin full access
CREATE POLICY "Everyone can view published posts" ON posts FOR SELECT USING (is_published = true);
CREATE POLICY "Admins have full access to posts" ON posts FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Complaints: Everyone can insert, admin full access
CREATE POLICY "Everyone can submit complaints" ON complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins have full access to complaints" ON complaints FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Organizations: Everyone view, admin full access
CREATE POLICY "Everyone can view organizations" ON organizations FOR SELECT USING (true);
CREATE POLICY "Admins have full access to organizations" ON organizations FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Infographics: Everyone view, admin full access
CREATE POLICY "Everyone can view infographics" ON infographics FOR SELECT USING (true);
CREATE POLICY "Admins have full access to infographics" ON infographics FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('app-9wnpatirc0e9_pmi_images', 'app-9wnpatirc0e9_pmi_images', true);

CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING (bucket_id = 'app-9wnpatirc0e9_pmi_images');
CREATE POLICY "Admin Upload Access" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'app-9wnpatirc0e9_pmi_images' AND is_admin(auth.uid()));
CREATE POLICY "Admin Delete Access" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'app-9wnpatirc0e9_pmi_images' AND is_admin(auth.uid()));
