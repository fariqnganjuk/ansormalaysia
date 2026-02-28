import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type AppUser, type Profile } from '@/db';

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    return await api.profiles.get(userId);
  } catch (error) {
    console.error('Gagal memuat profil:', error);
    return null;
  }
}
interface AuthContextType {
  user: AppUser | null;
  profile: Profile | null;
  loading: boolean;
  signInWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    const profileData = await getProfile(user.id);
    setProfile(profileData);
  };

  useEffect(() => {
    let mounted = true;

    api.auth.session()
      .then(({ user: sessionUser, profile: sessionProfile }) => {
        if (!mounted) return;
        setUser(sessionUser);
        setProfile(sessionProfile);
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
        setProfile(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const signInWithUsername = async (username: string, password: string) => {
    try {
      const result = await api.auth.login(username, password);
      setUser(result.user);
      setProfile(result.profile);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUpWithUsername = async (username: string, password: string) => {
    try {
      const result = await api.auth.register(username, password);
      setUser(result.user);
      setProfile(result.profile);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await api.auth.logout();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithUsername, signUpWithUsername, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
