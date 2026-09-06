// src/context/AuthContext.tsx
// ============================================================
// AIMS — authentication context.
// When the backend is configured (VITE_API_URL), sign-in goes through the
// AIMS API (JWT). When the API is unreachable or not configured, it falls
// back to the roster persona accounts so the app always works (demo mode).
// ============================================================
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Role } from '@/types';
import { ROLE_LABELS } from '@/config/roles';
import { LOGIN_STAFF } from '@/data/roster';
import {
  apiEnabled,
  apiLogin,
  apiLogout,
  apiMe,
  getCachedUser,
  getToken,
  setCachedUser,
  setToken,
  type ApiUser,
} from '@/lib/api';

// Persona accounts are derived from the unified staff roster —
// one source of truth for identity across the whole system.
const MOCK_USERS: Record<string, User> = Object.fromEntries(
  LOGIN_STAFF.map((s) => [
    s.loginEmail as string,
    {
      id: s.id,
      name: s.name,
      email: s.loginEmail as string,
      role: s.role,
      department: s.department,
      status: 'active',
      createdAt: '2025-01-15',
    } as User,
  ])
);

export interface LoginOutcome {
  user: User | null;
  error: string | null;
  /** 'api' = authenticated by the AIMS backend; 'local' = persona/demo fallback */
  mode: 'api' | 'local';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  /** Whether the current session (if any) came from the backend API */
  authMode: 'api' | 'local';
  login: (email: string, password: string) => Promise<LoginOutcome>;
  logout: () => void;
  getRoleLabel: (role: Role) => string;
  updateAvatar: (url: string) => void;
}

/** Map a backend user to the frontend User shape (defensive on status). */
function toUser(apiUser: ApiUser): User {
  const status: User['status'] =
    apiUser.status === 'active' || apiUser.status === 'inactive' || apiUser.status === 'suspended'
      ? apiUser.status
      : 'active';
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    role: apiUser.role,
    department: apiUser.department ?? '',
    status,
    createdAt: apiUser.createdAt,
    avatarUrl: apiUser.avatarUrl,
  };
}

function personaFor(email: string): User | null {
  return MOCK_USERS[email.toLowerCase()] ?? null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'api' | 'local'>('local');

  // Restore a backend session on app load (token present → /auth/me).
  // Offline: keep the cached user so the app still works; rejected token:
  // clear the session.
  useEffect(() => {
    let cancelled = false;
    if (!apiEnabled) return;
    const token = getToken();
    if (!token) return;

    const cached = getCachedUser();
    if (cached) {
      setUser(toUser(cached));
      setAuthMode('api');
    }

    apiMe().then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setUser(toUser(res.data));
        setCachedUser(res.data);
        setAuthMode('api');
      } else if (res.status !== 0) {
        // Server reachable but the token is invalid/expired
        setToken(null);
        setCachedUser(null);
        setUser(null);
        setAuthMode('local');
      }
      // status 0 = network error: keep the cached session (offline mode)
    });

    return () => { cancelled = true; };
  }, []);

  const login = async (emailRaw: string, passwordRaw: string): Promise<LoginOutcome> => {
    const email = emailRaw.trim().toLowerCase();

    // 1) Real backend (when configured and reachable)
    if (apiEnabled) {
      const res = await apiLogin(email, passwordRaw);
      if (res.ok) {
        const apiUser = res.data.user;
        const u = toUser(apiUser);
        setToken(res.data.token);
        setCachedUser(apiUser);
        setUser(u);
        setAuthMode('api');
        return { user: u, error: null, mode: 'api' };
      }
      if (res.status !== 0) {
        // Server responded: invalid credentials or server error — no fallback.
        return { user: null, error: res.error || 'Invalid email or password', mode: 'api' };
      }
      // status 0 = server unreachable → fall through to persona demo login
    }

    // 2) Persona fallback (demo/offline): roster email, any password
    const persona = personaFor(email);
    if (persona) {
      setUser(persona);
      setAuthMode('local');
      return { user: persona, error: null, mode: 'local' };
    }
    return { user: null, error: 'Invalid email or password', mode: 'local' };
  };

  const logout = () => {
    if (apiEnabled && getToken()) {
      apiLogout().catch(() => { /* fire and forget */ });
    }
    setToken(null);
    setCachedUser(null);
    setUser(null);
    setAuthMode('local');
  };

  const getRoleLabel = (role: Role) => ROLE_LABELS[role];
  const updateAvatar = (url: string) => { if (user) setUser({ ...user, avatarUrl: url }); };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        authMode,
        login,
        logout,
        getRoleLabel,
        updateAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
