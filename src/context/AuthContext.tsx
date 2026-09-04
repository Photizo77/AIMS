// src/context/AuthContext.tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User, Role } from '@/types';
import { ROLE_LABELS } from '@/config/roles';
import { LOGIN_STAFF } from '@/data/roster';

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

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  /** Verify credentials against the roster-derived accounts; returns the signed-in user or null */
  login: (email: string, password: string) => User | null;
  logout: () => void;
  getRoleLabel: (role: Role) => string;
  updateAvatar: (url: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, _password: string): User | null => {
    const foundUser = MOCK_USERS[email.toLowerCase()];
    if (foundUser) {
      setUser(foundUser);
      return foundUser;
    }
    return null;
  };

  const logout = () => setUser(null);
  const getRoleLabel = (role: Role) => ROLE_LABELS[role];
  const updateAvatar = (url: string) => { if (user) setUser({ ...user, avatarUrl: url }); };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, logout, getRoleLabel, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}